import { useAsync } from "@/hooks/useAsync";
import type { AsyncState } from "@/hooks/useAsync";
import { ApiError, apiFetch, comoEnvelope, comoPagina } from "@/lib/api";
import type { Pagina } from "@/lib/api";
import type { CultivoRef } from "@/types/datos";
import type {
  ActividadPublica,
  ActividadResumen,
  ConsultaActividades,
  EstablecimientoDeActividad,
  FaqActividad,
  FilterOption,
  FotoRef,
  TarifaActividad,
} from "@/types/catalogo";

/**
 * Catálogo público de actividades: el listado paginado del visitante, su
 * detalle y las dos facetas con las que se filtra (cultivos y departamentos).
 *
 * Todas las lecturas van **sin token**: son pantallas de `(sitio)`, que se ven
 * sin sesión, y el backend tiene `/actividades/**` abierto salvo `/reservar`.
 * Mismo criterio que `useCatalogoEstablecimientos`.
 */
const BASE = "/actividades";
const EXPLORAR = `${BASE}/explorar`;
const FILTRO_CULTIVOS = `${BASE}/cultivos`;
const FILTRO_DEPARTAMENTOS = `${BASE}/departamentos`;

/* ---- Respuestas crudas --------------------------------------------------- */

/** Item del listado. Campos opcionales: defensivo. */
interface ResumenBackend {
  id?: string;
  nombre?: string;
  precioRegular?: unknown;
  cultivos?: unknown;
  fotoPortada?: unknown;
  nombreEstablecimiento?: string;
  nombreDepartamento?: string;
}

interface DetalleBackend {
  id?: string;
  nombre?: string;
  cuposMax?: unknown;
  cultivos?: unknown;
  fotos?: unknown;
  descripcion?: string | null;
  incluye?: unknown;
  noIncluye?: unknown;
  establecimiento?: unknown;
  ubicacion?: unknown;
  preguntasFrecuentes?: unknown;
  tarifas?: unknown;
  precioRegular?: unknown;
}

/**
 * Opción de faceta. Ojo: acá la clave es `valor`, no `id` como en las facetas
 * de `/establecimientos`; es el `DTOFiltro` genérico del backend.
 */
interface FiltroBackend {
  valor?: unknown;
  nombre?: unknown;
  cantidad?: unknown;
}

/* ---- Mapeo --------------------------------------------------------------- */

function aTexto(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

function aNumero(v: unknown): number {
  return typeof v === "number" && Number.isFinite(v) ? v : 0;
}

/** El precio distingue "sin publicar" de $ 0, así que el `null` se conserva. */
function aNumeroOpcional(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

function aTextos(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.map(aTexto).filter((t) => t !== "");
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

/** Sin `downloadUrl` no hay nada que dibujar, así que esa foto no cuenta. */
function aFoto(v: unknown): FotoRef | null {
  if (!v || typeof v !== "object") return null;
  const f = v as { key?: unknown; nombre?: unknown; downloadUrl?: unknown };
  const url = aTexto(f.downloadUrl);
  return url === "" ? null : { key: aTexto(f.key), nombre: aTexto(f.nombre), url };
}

function aFotos(v: unknown): FotoRef[] {
  if (!Array.isArray(v)) return [];
  return v.map(aFoto).filter((f): f is FotoRef => f !== null);
}

function aEstablecimiento(v: unknown): EstablecimientoDeActividad {
  const e = (v ?? {}) as { id?: unknown; nombre?: unknown; departamento?: unknown; descripcion?: unknown };
  return {
    id: aTexto(e.id),
    nombre: aTexto(e.nombre),
    departamento: aTexto(e.departamento),
    descripcion: aTexto(e.descripcion),
  };
}

/** De `ubicacion` sólo interesa la dirección: el nombre ya viene por otro lado. */
function aDireccion(v: unknown): string {
  if (!v || typeof v !== "object") return "";
  return aTexto((v as { direccionEstablecimiento?: unknown }).direccionEstablecimiento);
}

function aFaqs(v: unknown): FaqActividad[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((f): f is { pregunta?: unknown; respuesta?: unknown } => !!f && typeof f === "object")
    .map((f) => ({ pregunta: aTexto(f.pregunta), respuesta: aTexto(f.respuesta) }))
    .filter((f) => f.pregunta !== "");
}

/** Tarifas de menor a mayor edad: es el orden en el que se leen los rangos. */
function aTarifas(v: unknown): TarifaActividad[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((t): t is Record<string, unknown> => !!t && typeof t === "object")
    .map((t) => ({
      id: aTexto(t.id),
      nombre: aTexto(t.nombre),
      edadMinima: aNumero(t.edadMinima),
      edadMaxima: aNumero(t.edadMaxima),
      precio: aNumero(t.precio),
      esBase: t.esTarifaBase === true,
    }))
    .filter((t) => t.nombre !== "")
    .sort((a, b) => a.edadMinima - b.edadMinima);
}

function aResumen(a: ResumenBackend): ActividadResumen {
  return {
    id: aTexto(a.id),
    nombre: aTexto(a.nombre),
    precioRegular: aNumeroOpcional(a.precioRegular),
    cultivos: aCultivos(a.cultivos),
    fotoPortada: aFoto(a.fotoPortada),
    nombreEstablecimiento: aTexto(a.nombreEstablecimiento),
    nombreDepartamento: aTexto(a.nombreDepartamento),
  };
}

function aDetalle(d: DetalleBackend): ActividadPublica {
  return {
    id: aTexto(d.id),
    nombre: aTexto(d.nombre),
    cuposMax: aNumero(d.cuposMax),
    cultivos: aNombresCultivo(d.cultivos),
    fotos: aFotos(d.fotos),
    descripcion: aTexto(d.descripcion),
    incluye: aTextos(d.incluye),
    noIncluye: aTextos(d.noIncluye),
    establecimiento: aEstablecimiento(d.establecimiento),
    direccion: aDireccion(d.ubicacion),
    preguntasFrecuentes: aFaqs(d.preguntasFrecuentes),
    tarifas: aTarifas(d.tarifas),
    precioRegular: aNumeroOpcional(d.precioRegular),
  };
}

function aOpcion(f: FiltroBackend): FilterOption {
  return { value: aTexto(f.valor), label: aTexto(f.nombre), count: aNumero(f.cantidad) };
}

/* ---- Lecturas ------------------------------------------------------------ */

/** GET público que devuelve `data`, o tira con el `code` del backend. */
async function leer<T>(path: string, mensaje: string): Promise<T | undefined> {
  const env = comoEnvelope<T>(await apiFetch<unknown>(path));
  if (!env.ok) throw new Error(env.code ?? mensaje);
  return env.data;
}

/**
 * Query del listado. `cultivosIds` se repite una vez por cultivo, que es como
 * Spring arma el `List<UUID>`; el resto va suelto. La búsqueda vacía se omite:
 * el backend la trata igual que ausente, pero así la URL queda limpia.
 */
function queryExplorar({ busqueda, cultivosIds, departamentoId, page, size }: ConsultaActividades): string {
  const qs = new URLSearchParams();
  const texto = busqueda.trim();
  if (texto) qs.set("busqueda", texto);
  for (const id of cultivosIds) qs.append("cultivosIds", id);
  if (departamentoId) qs.set("departamentoId", departamentoId);
  qs.set("page", String(page));
  qs.set("size", String(size));
  return `?${qs.toString()}`;
}

async function listarActividades(consulta: ConsultaActividades): Promise<Pagina<ActividadResumen>> {
  const data = await leer<unknown>(
    `${EXPLORAR}${queryExplorar(consulta)}`,
    "No pudimos cargar las actividades",
  );
  // Envelope ok sin `data` es página vacía, no error. Sin id no hay a dónde
  // linkear la tarjeta, así que esa fila se descarta.
  const pagina = comoPagina<ResumenBackend>(data);
  return { ...pagina, items: pagina.items.map(aResumen).filter((a) => a.id !== "") };
}

async function verDetalle(id: string): Promise<ActividadPublica | null> {
  try {
    const data = await leer<DetalleBackend>(
      `${BASE}/${encodeURIComponent(id)}`,
      "No pudimos cargar la actividad",
    );
    return data ? aDetalle(data) : null;
  } catch (e) {
    // Un id que no existe no es una falla técnica: la pantalla dibuja su propio
    // "no encontrada" en vez del panel de error con "Reintentar". El 400 entra
    // acá porque el id es el único parámetro: si el backend lo rechaza es que
    // no era un UUID (un link viejo, por ejemplo), no que algo se rompió.
    if (e instanceof ApiError && (e.status === 404 || e.status === 400)) return null;
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
 * Página del listado. Búsqueda, filtros y paginado los resuelve el backend, así
 * que cambiar cualquiera de ellos vuelve a pedir.
 */
export function useCatalogoActividades(
  consulta: ConsultaActividades,
): AsyncState<Pagina<ActividadResumen>> {
  return useAsync<Pagina<ActividadResumen>>(() => listarActividades(consulta), [
    consulta.busqueda,
    consulta.cultivosIds,
    consulta.departamentoId,
    consulta.page,
    consulta.size,
  ]);
}

/** Detalle de una actividad. `data` en `null` significa que no existe. */
export function useActividadPublica(id: string): AsyncState<ActividadPublica | null> {
  return useAsync<ActividadPublica | null>(() => verDetalle(id), [id]);
}

/**
 * Faceta de cultivos: el `count` es cuántas actividades publicadas trabaja cada
 * uno. El backend sólo cuenta las publicadas, así que toda opción da resultados.
 */
export function useFiltroCultivosActividad(): AsyncState<FilterOption[]> {
  return useAsync<FilterOption[]>(() =>
    listarFiltro(FILTRO_CULTIVOS, "No pudimos cargar los cultivos"),
  );
}

/** Faceta de departamentos, con la misma forma que la de cultivos. */
export function useFiltroDepartamentosActividad(): AsyncState<FilterOption[]> {
  return useAsync<FilterOption[]>(() =>
    listarFiltro(FILTRO_DEPARTAMENTOS, "No pudimos cargar los departamentos"),
  );
}
