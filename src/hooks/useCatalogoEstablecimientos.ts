import { useAsync } from "@/hooks/useAsync";
import type { AsyncState } from "@/hooks/useAsync";
import { ApiError, apiFetch, comoEnvelope, comoPagina } from "@/lib/api";
import type { Pagina } from "@/lib/api";
import type { CultivoRef } from "@/types/datos";
import type {
  ActividadOfrecida,
  ConsultaCatalogo,
  DepartamentoRef,
  EstablecimientoPublico,
  EstablecimientoResumen,
  FilterOption,
} from "@/types/catalogo";

/**
 * Catálogo público de establecimientos: el listado paginado del visitante, su
 * detalle y las dos facetas con las que se filtra (cultivos y departamentos).
 *
 * Todas las lecturas van **sin token**: son pantallas de `(sitio)`, que se ven
 * sin sesión. Mismo criterio que `useDepartamentos` y `usePaises`.
 */
const BASE = "/establecimientos";
const CATALOGO = `${BASE}/catalogo`;
const FILTRO_CULTIVOS = `${BASE}/filtros/cultivos`;
const FILTRO_DEPARTAMENTOS = `${BASE}/filtros/departamentos`;

/* ---- Respuestas crudas --------------------------------------------------- */

/** Item del listado. Campos opcionales: defensivo. */
interface ResumenBackend {
  id?: string;
  nombre?: string;
  razonSocial?: string;
  descripcion?: string | null;
  dptoEstablecimiento?: unknown;
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

/** El detalle nombra el departamento como texto, no como objeto. */
interface DetalleBackend {
  id?: string;
  nombre?: string;
  razonSocial?: string;
  descripcion?: string | null;
  departamento?: string | null;
  email?: string | null;
  telefono?: string | null;
  ubicacion?: string | null;
  cultivos?: unknown;
  actividades?: unknown;
}

/** Opción de faceta: misma forma para cultivos y departamentos. */
interface FiltroBackend {
  id?: string;
  nombre?: string;
  cantidadEstablecimientos?: unknown;
}

/* ---- Mapeo --------------------------------------------------------------- */

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

/**
 * Cultivos como `{ id, nombre }`. El id es lo que viaja en el filtro, así que
 * la fila sin id —o sin nombre que mostrar— se descarta.
 */
function aCultivos(v: unknown): CultivoRef[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((c): c is { id?: unknown; nombre?: unknown } => !!c && typeof c === "object")
    .map((c) => ({ id: aTexto(c.id), nombre: aTexto(c.nombre) }))
    .filter((c) => c.id !== "" && c.nombre !== "");
}

/** Sólo los nombres: el detalle muestra los cultivos, no filtra por ellos. */
function aNombresCultivo(v: unknown): string[] {
  return aCultivos(v).map((c) => c.nombre);
}

/** El departamento del listado viene anidado y con la clave `idDepartamento`. */
function aDepartamento(v: unknown): DepartamentoRef | null {
  if (!v || typeof v !== "object") return null;
  const d = v as { idDepartamento?: unknown; nombre?: unknown };
  const nombre = aTexto(d.nombre);
  // Sin nombre no hay nada que mostrar en la tarjeta.
  return nombre === "" ? null : { id: aTexto(d.idDepartamento), nombre };
}

function aResumen(e: ResumenBackend): EstablecimientoResumen {
  return {
    id: aTexto(e.id),
    nombre: aTexto(e.nombre),
    razonSocial: aTexto(e.razonSocial),
    descripcion: aTexto(e.descripcion),
    departamento: aDepartamento(e.dptoEstablecimiento),
    cultivos: aCultivos(e.cultivos),
    cantidadActividades: aNumero(e.cantidadActividades),
  };
}

function aActividad(a: ActividadBackend): ActividadOfrecida {
  return {
    id: aTexto(a.id),
    nombre: aTexto(a.nombre),
    cultivos: aNombresCultivo(a.cultivos),
    precioDesde: aNumeroOpcional(a.precioDesde),
    puntuacion: aNumeroOpcional(a.puntuacion),
  };
}

function aDetalle(d: DetalleBackend): EstablecimientoPublico {
  return {
    id: aTexto(d.id),
    nombre: aTexto(d.nombre),
    razonSocial: aTexto(d.razonSocial),
    descripcion: aTexto(d.descripcion),
    departamento: aTexto(d.departamento),
    email: aTexto(d.email),
    telefono: aTexto(d.telefono),
    ubicacion: aTexto(d.ubicacion),
    cultivos: aNombresCultivo(d.cultivos),
    // Sin id no se puede linkear la actividad: se descarta la fila.
    actividades: Array.isArray(d.actividades)
      ? d.actividades
          .filter((a): a is ActividadBackend => !!a && typeof a === "object")
          .map(aActividad)
          .filter((a) => a.id !== "")
      : [],
  };
}

function aOpcion(f: FiltroBackend): FilterOption {
  return {
    value: aTexto(f.id),
    label: aTexto(f.nombre),
    count: aNumero(f.cantidadEstablecimientos),
  };
}

/* ---- Lecturas ------------------------------------------------------------ */

/** GET público que devuelve `data`, o tira con el `code` del backend. */
async function leer<T>(path: string, mensaje: string): Promise<T | undefined> {
  const env = comoEnvelope<T>(await apiFetch<unknown>(path));
  if (!env.ok) throw new Error(env.code ?? mensaje);
  return env.data;
}

/**
 * Query del catálogo. `cultivosIds` se repite una vez por cultivo, que es como
 * Spring arma el `List<UUID>`; el departamento y la página van sueltos.
 */
function queryCatalogo({ cultivosIds, departamentoId, page, size }: ConsultaCatalogo): string {
  const qs = new URLSearchParams();
  for (const id of cultivosIds) qs.append("cultivosIds", id);
  if (departamentoId) qs.set("departamentoId", departamentoId);
  qs.set("page", String(page));
  qs.set("size", String(size));
  return `?${qs.toString()}`;
}

async function listarCatalogo(consulta: ConsultaCatalogo): Promise<Pagina<EstablecimientoResumen>> {
  const data = await leer<unknown>(
    `${CATALOGO}${queryCatalogo(consulta)}`,
    "No pudimos cargar los establecimientos",
  );
  // Envelope ok sin `data` es página vacía, no error. Sin id no hay a dónde
  // linkear la tarjeta, así que esa fila se descarta.
  const pagina = comoPagina<ResumenBackend>(data);
  return { ...pagina, items: pagina.items.map(aResumen).filter((e) => e.id !== "") };
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

/** Opciones de una faceta, ordenadas por nombre y sin las que no se pueden filtrar. */
async function listarFiltro(path: string, mensaje: string): Promise<FilterOption[]> {
  const data = await leer<FiltroBackend[]>(path, mensaje);
  if (!Array.isArray(data)) return [];
  return data
    .map(aOpcion)
    .filter((o) => o.value !== "" && o.label !== "")
    .sort((a, b) => a.label.localeCompare(b.label, "es"));
}

/* ---- Hooks --------------------------------------------------------------- */

/**
 * Página del catálogo. Filtros y paginado los resuelve el backend, así que
 * cambiar cualquiera de los dos vuelve a pedir el listado.
 */
export function useCatalogoEstablecimientos(
  consulta: ConsultaCatalogo,
): AsyncState<Pagina<EstablecimientoResumen>> {
  return useAsync<Pagina<EstablecimientoResumen>>(() => listarCatalogo(consulta), [
    consulta.cultivosIds,
    consulta.departamentoId,
    consulta.page,
    consulta.size,
  ]);
}

/** Detalle de un establecimiento. `data` en `null` significa que no existe. */
export function useEstablecimientoPublico(
  id: string,
): AsyncState<EstablecimientoPublico | null> {
  return useAsync<EstablecimientoPublico | null>(() => verDetalle(id), [id]);
}

/** Faceta de cultivos: el `count` es cuántos establecimientos trabajan cada uno. */
export function useFiltroCultivos(): AsyncState<FilterOption[]> {
  return useAsync<FilterOption[]>(() =>
    listarFiltro(FILTRO_CULTIVOS, "No pudimos cargar los cultivos"),
  );
}

/** Faceta de departamentos, con la misma forma que la de cultivos. */
export function useFiltroDepartamentos(): AsyncState<FilterOption[]> {
  return useAsync<FilterOption[]>(() =>
    listarFiltro(FILTRO_DEPARTAMENTOS, "No pudimos cargar los departamentos"),
  );
}
