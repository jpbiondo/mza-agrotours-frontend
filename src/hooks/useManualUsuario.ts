import { useCallback, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../firebase.config";
import { ApiError, apiFetch, comoEnvelope } from "@/lib/api";
import { descargar } from "@/lib/exportar";
import { pedirFirmas } from "@/lib/presign";
import { conToken, conTokenDe } from "@/lib/sesion";
import { putPrefirmado } from "@/lib/storage";
import type { ManualUsuario, ResultadoManual } from "@/types/manual";

const LECTURA = "/manual-usuario";
const ADMIN = "/admin/manual-usuario";
const PRESIGN = `${ADMIN}/archivos/presign`;

/** `DTOFotosResponse`. Campos opcionales: defensivo. */
interface ManualBackend {
  key?: unknown;
  nombre?: unknown;
  extension?: unknown;
  downloadUrl?: unknown;
}

/** Sin URL de descarga no hay nada que ofrecer: se lee como "no hay manual". */
function aManual(m: ManualBackend | undefined): ManualUsuario | null {
  const url = typeof m?.downloadUrl === "string" ? m.downloadUrl.trim() : "";
  if (!url) return null;
  const nombre = typeof m?.nombre === "string" && m.nombre.trim() ? m.nombre.trim() : "Manual de usuario.pdf";
  return { nombre, url };
}

interface UseManualUsuarioReturn {
  /** `null` también cuando cargó y todavía no se subió ninguno. */
  data: ManualUsuario | null;
  /**
   * Lo último que llegó bien. Al recargar después de reemplazarlo, la tarjeta
   * sigue mostrando el anterior en vez de volver al esqueleto.
   */
  ultimo: ManualUsuario | null;
  isLoading: boolean;
  /** El error tal cual: `AsyncView` lo traduce con `clasificarError`. */
  error: unknown;
  reload: () => void;
}

async function leer(token?: string): Promise<ManualUsuario | null> {
  try {
    const env = comoEnvelope<ManualBackend>(await apiFetch<unknown>(LECTURA, { token }));
    if (!env.ok) throw new Error(env.code ?? "No pudimos cargar el manual");
    return aManual(env.data);
  } catch (e) {
    // El 404 no es un error: es que el admin todavía no cargó ninguno.
    if (e instanceof ApiError && e.status === 404) return null;
    throw e;
  }
}

/**
 * GET /manual-usuario: el manual vigente. Sale con token si hay sesión y sin
 * él si no, por eso no usa `useLecturaConToken`, que sin sesión da error.
 *
 * TODO backend: `GET /manual-usuario` no está en los `permitAll` de
 * `SecurityConfig`, así que hoy sólo responde con sesión. Hasta que se abra, un
 * visitante anónimo no ve el manual.
 */
export function useManualUsuario(): UseManualUsuarioReturn {
  const [nonce, setNonce] = useState(0);
  // Lo cargado junto a la clave que lo trajo: mientras no coincida con la
  // actual, está cargando (ver `useRoles`).
  const [cargado, setCargado] = useState<{
    clave: number;
    data: ManualUsuario | null;
    error: unknown;
  } | null>(null);
  const [ultimo, setUltimo] = useState<ManualUsuario | null>(null);
  const alDia = cargado?.clave === nonce;

  useEffect(() => {
    let active = true;

    // La lectura sale al montar: `auth.currentUser` todavía puede estar vacío.
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!active) return;
      try {
        // Con sesión, `conTokenDe` renueva el token y reintenta ante un 401.
        const data = user ? await conTokenDe(user, (token) => leer(token)) : await leer();
        if (!active) return;
        setCargado({ clave: nonce, data, error: null });
        setUltimo(data);
      } catch (e) {
        if (active) setCargado({ clave: nonce, data: null, error: e });
      }
    });

    return () => {
      active = false;
      unsub();
    };
  }, [nonce]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);

  return {
    data: alDia ? cargado.data : null,
    ultimo,
    isLoading: !alDia,
    error: alDia ? cargado.error : null,
    reload,
  };
}

/**
 * Baja el manual a la computadora. Un `<a download>` no alcanza: el PDF está en
 * el bucket, que es otro origen, y ahí el navegador ignora `download` y lo abre
 * en una pestaña. Se trae el archivo y se guarda desde la página.
 *
 * Si el bucket no deja leerlo desde acá (CORS de GET), se abre en otra pestaña
 * como antes: el usuario lo ve igual y lo puede guardar desde el visor.
 *
 * TODO backend: firmar la URL de descarga con
 * `response-content-disposition=attachment` resolvería la descarga sin esta
 * vuelta y sin depender del CORS del bucket.
 */
export function useDescargarManual() {
  const [descargando, setDescargando] = useState(false);

  async function bajar(manual: ManualUsuario): Promise<void> {
    setDescargando(true);
    try {
      // Sin `apiFetch` ni token: el destino es el bucket y la firma va en la URL.
      const res = await fetch(manual.url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const nombre = /\.pdf$/i.test(manual.nombre) ? manual.nombre : `${manual.nombre}.pdf`;
      descargar(await res.blob(), nombre, "pdf");
    } catch {
      window.open(manual.url, "_blank", "noopener,noreferrer");
    } finally {
      setDescargando(false);
    }
  }

  return { bajar, descargando };
}

/** Qué acepta el backend para el manual: un PDF de hasta 55 MB. */
export const LIMITES_MANUAL = {
  maxFiles: 1,
  maxBytesPorArchivo: 55 * 1024 * 1024,
  accept: ".pdf,application/pdf",
  acceptLabel: "PDF",
  extensiones: ["pdf"],
  mimes: ["application/pdf"],
} as const;

/**
 * Reemplaza el manual vigente, en tres pasos: firma
 * (POST /admin/manual-usuario/archivos/presign), PUT del PDF al bucket y
 * confirmación (PUT /admin/manual-usuario con `{ key, nombre }`). Las dos
 * llamadas al backend piden GESTIONAR_PARAMETROS.
 *
 * Si falla después de subir, el objeto queda huérfano en el bucket hasta que
 * lo barra el backend, igual que con las fotos.
 */
export function useSubirManual() {
  const [subiendo, setSubiendo] = useState(false);

  async function subir(file: File): Promise<ResultadoManual> {
    setSubiendo(true);
    try {
      const firma = (await pedirFirmas(PRESIGN, [{ filename: file.name, fileSize: file.size }]))?.[0];
      if (!firma) return { ok: false, code: "presign" };

      // El content type va firmado: hay que repetir el que mandó el backend.
      const motivo = await putPrefirmado(firma.uploadUrl, file, firma.contentType ?? "application/pdf");
      if (motivo !== null) return { ok: false, code: "subida" };

      const res = await conToken((token) =>
        apiFetch<unknown>(ADMIN, {
          method: "PUT",
          token,
          body: JSON.stringify({ key: firma.key, nombre: firma.nombre || file.name }),
        }),
      );
      const env = comoEnvelope<ManualBackend>(res);
      if (!env.ok) return { ok: false, code: env.code };
      return { ok: true, manual: aManual(env.data) ?? undefined };
    } catch (e) {
      // 2xx sin cuerpo: se guardó igual.
      if (e instanceof SyntaxError) return { ok: true };
      return { ok: false, code: e instanceof ApiError ? e.code : undefined, error: e };
    } finally {
      setSubiendo(false);
    }
  }

  return { subir, subiendo };
}
