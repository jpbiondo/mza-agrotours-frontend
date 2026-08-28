import { useAsync } from "@/hooks/useAsync";
import type { AsyncState } from "@/hooks/useAsync";
import { ApiError, apiFetch, comoEnvelope } from "@/lib/api";
import type {
  ActividadOfrecida,
  EstablecimientoPublico,
  EstablecimientoResumen,
  FilterOption,
} from "@/types/catalogo";

/**
 * Catálogo público de establecimientos: el listado del visitante, su detalle y
 * los tipos de cultivo con los que se filtra.
 *
 * Las tres lecturas van **sin token**: son pantallas de `(sitio)`, que se ven
 * sin sesión. Mismo criterio que `useDepartamentos` y `usePaises`.
 */
const BASE = "/establecimientos";
const TIPOS_CULTIVO = "/tipo-cultivo";

/* ---- Respuestas crudas --------------------------------------------------- */

/** Item del listado. Campos opcionales: defensivo. */
interface ResumenBackend {
  id?: string;
  nombre?: string;
  razonSocial?: string;
  descripcion?: string | null;
  cultivos?: unknown;
  cantidadActividades?: unknown;
}

interface ActividadBackend {
  id?: string;
  nombre?: string;
  cultivos?: unknown;
  precioDesde?: unknown;
  puntuacion?: unknown;
}

interface DetalleBackend extends ResumenBackend {
  departamento?: string | null;
  email?: string | null;
  telefono?: string | null;
  ubicacion?: string | null;
  actividades?: unknown;
}

interface TipoCultivoBackend {
  id?: string;
  nombre?: string;
}

/* ---- Mapeo --------------------------------------------------------------- */

/** Nombres de cultivo, descartando lo que no sea un string con contenido. */
function aCultivos(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((c): c is string => typeof c === "string" && c.trim() !== "");
}

function aTexto(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

function aNumero(v: unknown): number {
  return typeof v === "number" && Number.isFinite(v) ? v : 0;
}

/** Precio y puntuación distinguen "sin cargar" de 0, así que el `null` se conserva. */
function aNumeroOpcional(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

function aResumen(e: ResumenBackend): EstablecimientoResumen {
  return {
    id: aTexto(e.id),
    nombre: aTexto(e.nombre),
    razonSocial: aTexto(e.razonSocial),
    descripcion: aTexto(e.descripcion),
    cultivos: aCultivos(e.cultivos),
    cantidadActividades: aNumero(e.cantidadActividades),
  };
}

function aActividad(a: ActividadBackend): ActividadOfrecida {
  return {
    id: aTexto(a.id),
    nombre: aTexto(a.nombre),
    cultivos: aCultivos(a.cultivos),
    precioDesde: aNumeroOpcional(a.precioDesde),
    puntuacion: aNumeroOpcional(a.puntuacion),
  };
}

function aDetalle(d: DetalleBackend): EstablecimientoPublico {
  return {
    ...aResumen(d),
    departamento: aTexto(d.departamento),
    email: aTexto(d.email),
    telefono: aTexto(d.telefono),
    ubicacion: aTexto(d.ubicacion),
    // Sin id no se puede linkear la actividad: se descarta la fila.
    actividades: Array.isArray(d.actividades)
      ? d.actividades
          .filter((a): a is ActividadBackend => !!a && typeof a === "object")
          .map(aActividad)
          .filter((a) => a.id !== "")
      : [],
  };
}

/* ---- Lecturas ------------------------------------------------------------ */

/** GET público que devuelve `data`, o tira con el `code` del backend. */
async function leer<T>(path: string, mensaje: string): Promise<T | undefined> {
  const env = comoEnvelope<T>(await apiFetch<unknown>(path));
  if (!env.ok) throw new Error(env.code ?? mensaje);
  return env.data;
}

async function listar(cultivo: string | null): Promise<EstablecimientoResumen[]> {
  // El filtro lo resuelve el backend: por ahora viaja el nombre del cultivo.
  const query = cultivo ? `?tipo-cultivo=${encodeURIComponent(cultivo)}` : "";
  const data = await leer<ResumenBackend[]>(
    `${BASE}${query}`,
    "No pudimos cargar los establecimientos",
  );
  // Envelope ok sin `data` es lista vacía, no error. Sin id no hay a dónde
  // linkear la tarjeta, así que esa fila se descarta.
  if (!Array.isArray(data)) return [];
  return data.map(aResumen).filter((e) => e.id !== "");
}

async function verDetalle(id: string): Promise<EstablecimientoPublico | null> {
  try {
    const data = await leer<DetalleBackend>(
      `${BASE}/${encodeURIComponent(id)}/detalle`,
      "No pudimos cargar el establecimiento",
    );
    return data ? aDetalle(data) : null;
  } catch (e) {
    // Un id que no existe no es una falla técnica: la pantalla dibuja su propio
    // "no encontrado" en vez del panel de error con "Reintentar".
    if (e instanceof ApiError && e.status === 404) return null;
    throw e;
  }
}

async function listarTiposCultivo(): Promise<FilterOption[]> {
  const data = await leer<TipoCultivoBackend[]>(
    TIPOS_CULTIVO,
    "No pudimos cargar los cultivos",
  );
  if (!Array.isArray(data)) return [];
  // El filtro viaja por nombre, así que el nombre es el valor de la opción; los
  // repetidos colapsan solos.
  const nombres = new Set(data.map((t) => aTexto(t.nombre)).filter((n) => n !== ""));
  return [...nombres]
    .sort((a, b) => a.localeCompare(b, "es"))
    .map((n) => ({ value: n, label: n }));
}

/* ---- Hooks --------------------------------------------------------------- */

/**
 * Listado del catálogo. `cultivo` en `null` trae todos; con un nombre, el
 * backend filtra y la pantalla vuelve a pedir.
 */
export function useEstablecimientosPublicos(
  cultivo: string | null,
): AsyncState<EstablecimientoResumen[]> {
  return useAsync<EstablecimientoResumen[]>(() => listar(cultivo), [cultivo]);
}

/** Detalle de un establecimiento. `data` en `null` significa que no existe. */
export function useEstablecimientoPublico(
  id: string,
): AsyncState<EstablecimientoPublico | null> {
  return useAsync<EstablecimientoPublico | null>(() => verDetalle(id), [id]);
}

/** Opciones del filtro por cultivo. Sin `count`: el backend no los cuenta. */
export function useTiposCultivo(): AsyncState<FilterOption[]> {
  return useAsync<FilterOption[]>(listarTiposCultivo);
}
