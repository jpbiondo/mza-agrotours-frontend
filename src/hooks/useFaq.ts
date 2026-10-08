import { useCallback, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../firebase.config";
import { ApiError, apiFetch, comoEnvelope, comoPagina } from "@/lib/api";
import { conToken } from "@/lib/sesion";
import type { DatosFaq, FaqItem, ResultadoFaq } from "@/types/catalogo";

const BASE = "/admin/faq";

/**
 * Las pantallas filtran y cuentan por categoría en el cliente (la de admin,
 * sobre el resultado de la búsqueda), así que traen la base entera de una vez: son decenas de entradas, no miles.
 * TODO backend: un listado sin paginar, o `/admin/faq/categorias` con conteos
 * que respeten la búsqueda, para no depender de un tamaño de página grande.
 */
const LISTADO = `${BASE}?size=1000`;
const LISTADO_PUBLICO = "/faq?size=1000";

/**
 * El enum `CategoriaFAQNombre` viaja por su `@JsonValue` ("General", "Reservas"…)
 * tanto en las respuestas como en el cuerpo de las escrituras. Del lado de acá
 * las categorías son los ids de `FAQ_CATEGORIAS`.
 */
const CATEGORIA_BACKEND: Record<string, string> = {
  general: "General",
  reservas: "Reservas",
  cuenta: "Cuenta",
  productores: "Productores",
  pagos: "Pagos",
};
const CATEGORIA_FRONT: Record<string, string> = Object.fromEntries(
  Object.entries(CATEGORIA_BACKEND).map(([id, nombre]) => [nombre, id]),
);

/** Entrada cruda del listado. Campos opcionales: defensivo. */
interface FaqBackend {
  id?: string;
  categoria?: string;
  pregunta?: string;
  respuesta?: string;
}

function aFaq(f: FaqBackend, i: number): FaqItem {
  return {
    id: f.id ?? `sin-id-${i}`,
    // Una categoría que no conocemos cae en "general" en vez de quedar huérfana
    // de todos los filtros.
    cat: (f.categoria && CATEGORIA_FRONT[f.categoria]) || "general",
    q: f.pregunta ?? "",
    a: f.respuesta ?? "",
  };
}

function aCuerpo(datos: DatosFaq): string {
  return JSON.stringify({
    pregunta: datos.q,
    respuesta: datos.a,
    categoria: CATEGORIA_BACKEND[datos.cat] ?? CATEGORIA_BACKEND.general,
  });
}

interface UseFaqReturn {
  /** Siempre definido: `[]` significa "cargó y no hay ninguna". */
  data: FaqItem[];
  isLoading: boolean;
  error: string | null;
  reload: () => void;
}

/**
 * Lee un listado de FAQ entero. `exigeSesion` distingue el de administración,
 * que sin sesión ni se intenta, del público, que sale con token si lo hay.
 */
function useListadoFaq(path: string, exigeSesion: boolean): UseFaqReturn {
  const [nonce, setNonce] = useState(0);
  // Lo cargado junto a la clave que lo trajo: mientras no coincida con la
  // actual, la pantalla está cargando (ver `useRoles`).
  const [cargado, setCargado] = useState<{
    clave: number;
    data: FaqItem[];
    error: string | null;
  } | null>(null);
  const alDia = cargado?.clave === nonce;

  useEffect(() => {
    let active = true;
    const fin = (datos: Partial<{ data: FaqItem[]; error: string }>) =>
      setCargado({ clave: nonce, data: [], error: null, ...datos });

    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!active) return;
      if (!user && exigeSesion) {
        fin({ error: "Necesitás iniciar sesión para ver las preguntas frecuentes" });
        return;
      }
      try {
        const token = user ? await user.getIdToken() : undefined;
        const res = await apiFetch<unknown>(path, { token });
        if (!active) return;
        const env = comoEnvelope<unknown>(res);
        if (!env.ok) {
          fin({ error: env.code ?? "No pudimos cargar las preguntas frecuentes" });
          return;
        }
        fin({ data: comoPagina<FaqBackend>(env.data).items.map(aFaq) });
      } catch (e) {
        if (active) fin({ error: e instanceof Error ? e.message : "Error inesperado" });
      }
    });

    return () => {
      active = false;
      unsub();
    };
  }, [nonce, path, exigeSesion]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);

  return {
    data: alDia ? cargado.data : [],
    isLoading: !alDia,
    error: alDia ? cargado.error : null,
    reload,
  };
}

/** La base de conocimiento completa, para la pantalla de administración. */
export function useFaq(): UseFaqReturn {
  return useListadoFaq(LISTADO, true);
}

/**
 * La base de conocimiento tal como la consultan los usuarios.
 * TODO backend: `GET /faq/**` no está en los `permitAll` de `SecurityConfig`,
 * así que hoy sólo responde con sesión. Hasta que se abra, un visitante
 * anónimo ve el error de carga.
 */
export function useFaqPublica(): UseFaqReturn {
  return useListadoFaq(LISTADO_PUBLICO, false);
}

/** Corre una escritura y la reduce a `{ ok, code?, id? }`. */
async function escribir(
  path: string,
  init: { method: "POST" | "PUT" | "DELETE"; body?: string },
): Promise<ResultadoFaq> {
  try {
    const res = await conToken((token) => apiFetch<unknown>(path, { ...init, token }));
    const env = comoEnvelope<{ id?: string }>(res);
    return env.ok ? { ok: true, id: env.data?.id } : { ok: false, code: env.code };
  } catch (e) {
    if (e instanceof ApiError) return { ok: false, code: e.code };
    // 2xx con cuerpo vacío: la escritura se hizo.
    if (e instanceof SyntaxError) return { ok: true };
    return { ok: false };
  }
}

/** Alta, modificación y baja de entradas de la base de conocimiento. */
export function useFaqCrud() {
  const [guardando, setGuardando] = useState(false);
  const [borrando, setBorrando] = useState(false);

  const faqUrl = (id: string) => `${BASE}/${encodeURIComponent(id)}`;

  async function crear(datos: DatosFaq): Promise<ResultadoFaq> {
    setGuardando(true);
    try {
      return await escribir(`${BASE}/create`, { method: "POST", body: aCuerpo(datos) });
    } finally {
      setGuardando(false);
    }
  }

  async function actualizar(id: string, datos: DatosFaq): Promise<ResultadoFaq> {
    setGuardando(true);
    try {
      return await escribir(faqUrl(id), { method: "PUT", body: aCuerpo(datos) });
    } finally {
      setGuardando(false);
    }
  }

  async function eliminar(id: string): Promise<ResultadoFaq> {
    setBorrando(true);
    try {
      return await escribir(faqUrl(id), { method: "DELETE" });
    } finally {
      setBorrando(false);
    }
  }

  return { crear, actualizar, eliminar, guardando, borrando };
}
