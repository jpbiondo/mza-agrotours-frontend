import { useCallback, useEffect, useMemo, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../firebase.config";
import { useTiposCultivo } from "@/hooks/useTiposCultivo";
import { ApiError, apiFetch, comoEnvelope } from "@/lib/api";
import { conToken } from "@/lib/sesion";
import { aImagenGuardada } from "@/lib/imagen";
import type {
  CultivoOpcion, DatosReceta, DificultadId, RecetaCatalogo,
} from "@/types/gestionCr";

const BASE = "/admin/recetas";

const DIFICULTADES: DificultadId[] = ["FACIL", "MEDIA", "DIFICIL"];

function aDificultad(v: unknown): DificultadId {
  return typeof v === "string" && (DIFICULTADES as string[]).includes(v)
    ? (v as DificultadId)
    : "MEDIA";
}

function aTexto(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

function aNumero(v: unknown): number {
  return typeof v === "number" && Number.isFinite(v) ? v : 0;
}

function aTextos(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is string => typeof x === "string");
}

/* ---- Respuestas crudas --------------------------------------------------- */

interface RecetaBackend {
  id?: string;
  nombre?: string;
  nombresCultivos?: unknown;
  dificultad?: unknown;
  tiempoMinsAprox?: unknown;
  duracionNombre?: string | null;
  cantidadPasos?: unknown;
  porciones?: unknown;
  foto?: unknown;
}

interface CatalogoBackend {
  totalRecetas?: unknown;
  cultivosConReceta?: unknown;
  recetas?: RecetaBackend[] | null;
}

interface DetalleBackend {
  nombre?: string;
  cultivos?: unknown;
  dificultad?: unknown;
  tiempoMinsAprox?: unknown;
  porciones?: unknown;
  descripcion?: string;
  ingredientes?: unknown;
  pasos?: unknown;
  foto?: unknown;
}

function aReceta(r: RecetaBackend): RecetaCatalogo {
  return {
    id: aTexto(r.id),
    nombre: r.nombre ?? "",
    nombresCultivos: aTextos(r.nombresCultivos),
    dificultad: aDificultad(r.dificultad),
    tiempoMinsAprox: aNumero(r.tiempoMinsAprox),
    duracionNombre: aTexto(r.duracionNombre),
    cantidadPasos: aNumero(r.cantidadPasos),
    porciones: aNumero(r.porciones),
    foto: aImagenGuardada(r.foto),
  };
}

/** Los cultivos del detalle vienen como `{id, nombre}`; al formulario le sirven los ids. */
function aCultivosIds(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((c): c is { id?: unknown } => !!c && typeof c === "object")
    .map((c) => aTexto(c.id))
    .filter((id) => id !== "");
}

/* ---- Catálogo ------------------------------------------------------------ */

interface UseCatalogoReturn {
  /** Siempre definido: `[]` significa "cargó y no hay ninguna". */
  recetas: RecetaCatalogo[];
  /** Cuántos cultivos tienen al menos una receta. Lo cuenta el backend. */
  cultivosConReceta: number;
  isLoading: boolean;
  error: string | null;
  /** Recarga mostrando el esqueleto; para el botón de reintentar. */
  reload: () => void;
  /** Recarga en silencio, sin tocar `isLoading`; para después de mutar. */
  refrescar: () => void;
}

export function useCatalogoRecetas(): UseCatalogoReturn {
  const [recetas, setRecetas] = useState<RecetaCatalogo[]>([]);
  const [cultivosConReceta, setCultivosConReceta] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    let active = true;

    // El pedido sale al montar la pantalla: `auth.currentUser` todavía puede
    // estar vacío y el listado saldría sin token.
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!active) return;
      if (!user) {
        setError("Necesitás iniciar sesión para ver el recetario");
        setIsLoading(false);
        return;
      }
      try {
        const token = await user.getIdToken();
        const res = await apiFetch<unknown>(BASE, { token });
        if (!active) return;
        const env = comoEnvelope<CatalogoBackend>(res);
        if (!env.ok || !env.data) {
          // Con filas ya en pantalla esto es un refresco posterior a una
          // escritura que salió bien: se conserva lo que hay.
          setRecetas((prev) => {
            if (prev.length === 0) setError(env.code ?? "No pudimos cargar el recetario");
            return prev;
          });
          return;
        }
        // Sin id no se puede ni editar ni borrar la fila: se descarta.
        setRecetas((env.data.recetas ?? []).map(aReceta).filter((r) => r.id !== ""));
        setCultivosConReceta(aNumero(env.data.cultivosConReceta));
        setError(null);
      } catch (e) {
        if (!active) return;
        setRecetas((prev) => {
          if (prev.length === 0) {
            setError(e instanceof Error ? e.message : "Error inesperado");
          }
          return prev;
        });
      } finally {
        if (active) setIsLoading(false);
      }
    });

    return () => {
      active = false;
      unsub();
    };
  }, [nonce]);

  const reload = useCallback(() => {
    setIsLoading(true);
    setError(null);
    setNonce((n) => n + 1);
  }, []);

  const refrescar = useCallback(() => setNonce((n) => n + 1), []);

  return { recetas, cultivosConReceta, isLoading, error, reload, refrescar };
}

/* ---- Cultivos para asociar ----------------------------------------------- */

/**
 * Cultivos que se pueden asociar a una receta, ordenados por nombre.
 *
 * Sale del catálogo público (`GET /tipo-cultivo/short`) y no de
 * `/admin/tipos-cultivo` a propósito: ese último exige GESTIONAR_CULTIVOS, y
 * quien administra el recetario no tiene por qué poder editar el catálogo de
 * cultivos. Los nombres de los cultivos son públicos, así que no se expone nada
 * de más.
 */
export function useCultivosDisponibles(): { cultivos: CultivoOpcion[]; isLoading: boolean } {
  const { cultivos: sinOrden, isLoading } = useTiposCultivo(true);

  // El backend no garantiza orden; el selector los muestra todos juntos.
  const cultivos = useMemo(
    () => [...sinOrden].sort((a, b) => a.nombre.localeCompare(b.nombre, "es")),
    [sinOrden],
  );

  return { cultivos, isLoading };
}

/* ---- Detalle ------------------------------------------------------------- */

/**
 * GET /admin/recetas/{id}, imperativo: se dispara al tocar "Editar" y la
 * pantalla necesita saber cuándo resolvió para recién ahí abrir el panel ya
 * poblado. El listado no trae descripción, ingredientes ni pasos.
 */
export function useRecetaDetalle() {
  const [isLoading, setIsLoading] = useState(false);

  async function cargar(id: string): Promise<{ ok: boolean; code?: string; datos?: DatosReceta }> {
    setIsLoading(true);
    try {
      const res = await conToken((token) =>
        apiFetch<unknown>(`${BASE}/${encodeURIComponent(id)}`, { token }),
      );
      const env = comoEnvelope<DetalleBackend>(res);
      if (!env.ok || !env.data) return { ok: false, code: env.code };
      return {
        ok: true,
        datos: {
          nombre: env.data.nombre ?? "",
          cultivosIds: aCultivosIds(env.data.cultivos),
          dificultad: aDificultad(env.data.dificultad),
          tiempoMinsAprox: aNumero(env.data.tiempoMinsAprox),
          porciones: aNumero(env.data.porciones),
          descripcion: env.data.descripcion ?? "",
          ingredientes: aTextos(env.data.ingredientes),
          pasos: aTextos(env.data.pasos),
          foto: aImagenGuardada(env.data.foto),
        },
      };
    } catch (e) {
      if (e instanceof ApiError) return { ok: false, code: e.code };
      return { ok: false };
    } finally {
      setIsLoading(false);
    }
  }

  return { cargar, isLoading };
}

/* ---- Escrituras ---------------------------------------------------------- */

type Resultado = {
  ok: boolean;
  code?: string;
  /** Motivos que devolvió el backend, ya redactados para el usuario. */
  errores?: string[];
};

/**
 * Cuerpo del alta y de la edición: el backend usa la misma forma para los dos.
 * `DatosReceta` ya tiene los nombres del DTO, así que va tal cual; la única
 * traducción —la dificultad— está en el propio tipo.
 */
/**
 * Cuerpo del alta y de la edición (DTORecetaAM). La foto se reduce a
 * `{ key, nombre }`: el `downloadUrl` que trajo la lectura no va, y el campo
 * viaja SIEMPRE porque el PUT reemplaza el estado completo —una `foto` ausente
 * le dice al backend que la quite—.
 */
function cuerpo(datos: DatosReceta) {
  const { foto, ...resto } = datos;
  return JSON.stringify({
    ...resto,
    foto: foto ? { key: foto.key, nombre: foto.nombre } : null,
  });
}

/**
 * Los rechazos traen el detalle en `data` (el mapa campo→mensaje de
 * `validationError`) o en `message` (los de dominio, como el nombre repetido).
 * Sólo se lee el `message` de los códigos conocidos: el del 500 es la excepción
 * de Java, que no es algo para mostrarle a nadie.
 */
const CON_MENSAJE = new Set(["entityAlreadyExists", "entityNotFound", "validacionNegocio"]);

function erroresDe(res: unknown): string[] | undefined {
  const payload = (res ?? {}) as { code?: unknown; data?: unknown; message?: unknown };

  const data = payload.data;
  const delData = Array.isArray(data)
    ? data
    : data && typeof data === "object"
      ? Object.values(data as Record<string, unknown>)
      : [];
  const textos = delData.filter((m): m is string => typeof m === "string" && m.trim() !== "");
  if (textos.length > 0) return textos;

  const code = typeof payload.code === "string" ? payload.code : "";
  const message = typeof payload.message === "string" ? payload.message.trim() : "";
  return CON_MENSAJE.has(code) && message !== "" ? [message] : undefined;
}

function comoResultado(e: unknown): Resultado {
  if (e instanceof ApiError) return { ok: false, code: e.code, errores: erroresDe(e.body) };
  // `apiFetch` sólo llega a res.json() con un 2xx: un error de parseo es una
  // escritura hecha y contestada sin cuerpo.
  if (e instanceof SyntaxError) return { ok: true };
  return { ok: false };
}

export function useCrearReceta() {
  const [isLoading, setIsLoading] = useState(false);

  async function crear(datos: DatosReceta): Promise<Resultado> {
    setIsLoading(true);
    try {
      const res = await conToken((token) =>
        apiFetch<unknown>(`${BASE}/alta`, { method: "POST", token, body: cuerpo(datos) }),
      );
      const env = comoEnvelope<unknown>(res);
      return env.ok ? { ok: true } : { ok: false, code: env.code, errores: erroresDe(res) };
    } catch (e) {
      return comoResultado(e);
    } finally {
      setIsLoading(false);
    }
  }

  return { crear, isLoading };
}

export function useActualizarReceta() {
  const [isLoading, setIsLoading] = useState(false);

  async function actualizar(id: string, datos: DatosReceta): Promise<Resultado> {
    setIsLoading(true);
    try {
      const res = await conToken((token) =>
        apiFetch<unknown>(`${BASE}/${encodeURIComponent(id)}`, {
          method: "PUT",
          token,
          body: cuerpo(datos),
        }),
      );
      const env = comoEnvelope<unknown>(res);
      return env.ok ? { ok: true } : { ok: false, code: env.code, errores: erroresDe(res) };
    } catch (e) {
      return comoResultado(e);
    } finally {
      setIsLoading(false);
    }
  }

  return { actualizar, isLoading };
}

export function useEliminarReceta() {
  const [isLoading, setIsLoading] = useState(false);

  async function eliminar(id: string): Promise<Resultado> {
    setIsLoading(true);
    try {
      const res = await conToken((token) =>
        apiFetch<unknown>(`${BASE}/${encodeURIComponent(id)}`, { method: "DELETE", token }),
      );
      const env = comoEnvelope<unknown>(res);
      return env.ok ? { ok: true } : { ok: false, code: env.code, errores: erroresDe(res) };
    } catch (e) {
      return comoResultado(e);
    } finally {
      setIsLoading(false);
    }
  }

  return { eliminar, isLoading };
}
