import { aFoto } from "@/hooks/useCatalogoActividades";
import { useAsync } from "@/hooks/useAsync";
import type { AsyncState } from "@/hooks/useAsync";
import { ApiError, apiFetch, comoEnvelope, comoPagina } from "@/lib/api";
import type { Pagina } from "@/lib/api";
import type {
  ConsultaRecetas,
  CultivoConRecetas,
  CultivoDeReceta,
  DificultadId,
  DuracionId,
  FiltrosRecetas,
  OpcionFiltro,
  PasoReceta,
  RecetaDetalle,
  RecetaResumen,
} from "@/types/recetas";

/**
 * Recetario del visitante: el listado paginado con sus tres filtros y el detalle
 * de una receta.
 *
 * Todas las lecturas van **sin token**: `/recetas` y `/recetas/**` son públicas
 * en el backend. Mismo criterio que `useCatalogoCultivos`.
 *
 * Ojo con el path: este es `/recetas` (el controller del visitante), que no es
 * el `/admin/recetas` de `useGestionRecetas` —ese exige permisos y devuelve los
 * datos editables—.
 */
const BASE = "/recetas";

/* ---- Respuestas crudas --------------------------------------------------- */

interface CultivoBackend {
  id?: string;
  nombre?: string;
}

interface ResumenBackend {
  id?: string;
  nombre?: string;
  cultivos?: unknown;
  dificultad?: unknown;
  tiempo?: string | null;
  porciones?: unknown;
  cantidadPasos?: unknown;
  foto?: unknown;
}

interface IngredienteBackend {
  /** Sí, todo junto y en minúscula: así lo nombra el DTO del backend. */
  nombreycantidad?: string | null;
}

interface PasoBackend {
  numeroPaso?: unknown;
  descripcion?: string | null;
}

interface DetalleBackend {
  id?: string;
  nombre?: string;
  descripcion?: string | null;
  tiempo?: string | null;
  porciones?: unknown;
  dificultad?: unknown;
  cultivos?: unknown;
  ingredientes?: unknown;
  pasos?: unknown;
  foto?: unknown;
}

interface FiltroDificultadBackend {
  dificultad?: unknown;
  cantidadRecetas?: unknown;
}

interface FiltroDuracionBackend {
  duracion?: unknown;
  cantidadRecetas?: unknown;
}

interface FiltroCultivoBackend {
  id?: string;
  nombre?: string;
  cantidadRecetas?: unknown;
}

/* ---- Vocabulario del backend --------------------------------------------- */

/**
 * Los valores de los dos enums, en su orden lógico. El backend devuelve sólo los
 * que hoy tienen recetas y en el orden que le salga de la consulta, así que las
 * píldoras se ordenan por estas listas y no por la respuesta.
 */
const DIFICULTADES: DificultadId[] = ["FACIL", "MEDIA", "DIFICIL"];
const DURACIONES: DuracionId[] = ["RAPIDA", "MEDIA", "LARGA"];

/* ---- Mapeo --------------------------------------------------------------- */

function aTexto(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

function aNumero(v: unknown): number {
  return typeof v === "number" && Number.isFinite(v) ? v : 0;
}

/** Descarta el valor que no esté en el enum en vez de inventarle uno. */
function aValorDeEnum<T extends string>(v: unknown, validos: T[]): T | null {
  const t = aTexto(v);
  return (validos as string[]).includes(t) ? (t as T) : null;
}

/** Sin id no hay a dónde linkear el cultivo, así que ese chip se descarta. */
function aCultivos(v: unknown): CultivoDeReceta[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((c): c is CultivoBackend => !!c && typeof c === "object")
    .map((c) => ({ id: aTexto(c.id), nombre: aTexto(c.nombre) }))
    .filter((c) => c.id !== "");
}

function aResumen(r: ResumenBackend): RecetaResumen {
  return {
    id: aTexto(r.id),
    nombre: aTexto(r.nombre),
    cultivos: aCultivos(r.cultivos),
    // La dificultad es obligatoria en el alta: si no viniera, la media es la
    // lectura menos engañosa de las tres.
    dificultad: aValorDeEnum(r.dificultad, DIFICULTADES) ?? "MEDIA",
    tiempo: aTexto(r.tiempo),
    porciones: aNumero(r.porciones),
    cantidadPasos: aNumero(r.cantidadPasos),
    foto: aFoto(r.foto),
  };
}

/** Los ingredientes vienen envueltos en un objeto de un solo campo. */
function aIngredientes(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((i): i is IngredienteBackend => !!i && typeof i === "object")
    .map((i) => aTexto(i.nombreycantidad))
    .filter((t) => t !== "");
}

/**
 * Pasos ordenados por su número. El backend ya los numera desde 1, pero el orden
 * del array no es parte del contrato: se ordena acá para que la lista no dependa
 * de cómo los devuelva la consulta.
 */
function aPasos(v: unknown): PasoReceta[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((p): p is PasoBackend => !!p && typeof p === "object")
    .map((p, i) => ({
      numero: aNumero(p.numeroPaso) || i + 1,
      descripcion: aTexto(p.descripcion),
    }))
    .filter((p) => p.descripcion !== "")
    .sort((a, b) => a.numero - b.numero);
}

function aDetalle(d: DetalleBackend): RecetaDetalle {
  return {
    id: aTexto(d.id),
    nombre: aTexto(d.nombre),
    descripcion: aTexto(d.descripcion),
    tiempo: aTexto(d.tiempo),
    porciones: aNumero(d.porciones),
    dificultad: aValorDeEnum(d.dificultad, DIFICULTADES) ?? "MEDIA",
    cultivos: aCultivos(d.cultivos),
    ingredientes: aIngredientes(d.ingredientes),
    pasos: aPasos(d.pasos),
    foto: aFoto(d.foto),
  };
}

/**
 * Opciones de un filtro de enum, ordenadas por `orden` y sin las que traigan un
 * valor que el front no conoce.
 */
function aOpciones<T extends string>(
  v: unknown,
  orden: T[],
  leer: (fila: Record<string, unknown>) => unknown,
): OpcionFiltro<T>[] {
  if (!Array.isArray(v)) return [];
  const cantidades = new Map<T, number>();
  for (const fila of v) {
    if (!fila || typeof fila !== "object") continue;
    const valor = aValorDeEnum(leer(fila as Record<string, unknown>), orden);
    if (valor) cantidades.set(valor, aNumero((fila as { cantidadRecetas?: unknown }).cantidadRecetas));
  }
  return orden.flatMap((valor) => {
    const cantidad = cantidades.get(valor);
    return cantidad === undefined ? [] : [{ valor, cantidad }];
  });
}

function aCultivosConRecetas(v: unknown): CultivoConRecetas[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((c): c is FiltroCultivoBackend => !!c && typeof c === "object")
    .map((c) => ({
      id: aTexto(c.id),
      nombre: aTexto(c.nombre),
      cantidad: aNumero(c.cantidadRecetas),
    }))
    .filter((c) => c.id !== "")
    .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
}

/* ---- Lecturas ------------------------------------------------------------ */

/** GET público que devuelve `data`, o tira con el `code` del backend. */
async function leer<T>(path: string, mensaje: string): Promise<T | undefined> {
  const env = comoEnvelope<T>(await apiFetch<unknown>(path));
  if (!env.ok) throw new Error(env.code ?? mensaje);
  return env.data;
}

/** Query del listado. Los filtros sólo viajan cuando hay uno elegido. */
function queryRecetas({ dificultad, duracion, cultivoId, orden, page, size }: ConsultaRecetas): string {
  const qs = new URLSearchParams();
  if (dificultad) qs.set("dificultad", dificultad);
  if (duracion) qs.set("duracion", duracion);
  if (cultivoId) qs.set("cultivoId", cultivoId);
  // Sin `sort` el backend ordena por id, que es el "sugerido" del listado.
  if (orden) qs.set("sort", orden);
  qs.set("page", String(page));
  qs.set("size", String(size));
  return `?${qs.toString()}`;
}

async function listarRecetas(consulta: ConsultaRecetas): Promise<Pagina<RecetaResumen>> {
  const data = await leer<unknown>(
    `${BASE}${queryRecetas(consulta)}`,
    "No pudimos cargar las recetas",
  );
  // Envelope ok sin `data` es página vacía, no error. Sin id no hay a dónde
  // linkear la tarjeta, así que esa fila se descarta.
  const pagina = comoPagina<ResumenBackend>(data);
  return { ...pagina, items: pagina.items.map(aResumen).filter((r) => r.id !== "") };
}

/**
 * Los tres filtros salen de tres endpoints distintos, pero la pantalla los
 * muestra en un solo bloque: se piden juntos para que aparezcan de una vez y no
 * de a uno.
 */
async function listarFiltros(): Promise<FiltrosRecetas> {
  const [dificultades, duraciones, cultivos] = await Promise.all([
    leer<unknown>(`${BASE}/filtros/dificultad`, "No pudimos cargar los filtros"),
    leer<unknown>(`${BASE}/filtros/duracion`, "No pudimos cargar los filtros"),
    leer<unknown>(`${BASE}/filtros/cultivos`, "No pudimos cargar los filtros"),
  ]);
  return {
    dificultades: aOpciones<DificultadId>(
      dificultades,
      DIFICULTADES,
      (f) => (f as FiltroDificultadBackend).dificultad,
    ),
    duraciones: aOpciones<DuracionId>(
      duraciones,
      DURACIONES,
      (f) => (f as FiltroDuracionBackend).duracion,
    ),
    cultivos: aCultivosConRecetas(cultivos),
  };
}

async function verDetalle(id: string): Promise<RecetaDetalle | null> {
  try {
    const data = await leer<DetalleBackend>(
      `${BASE}/${encodeURIComponent(id)}`,
      "No pudimos cargar la receta",
    );
    return data ? aDetalle(data) : null;
  } catch (e) {
    // Un id que no existe no es una falla técnica: la pantalla dibuja su propio
    // "no encontrada" en vez del panel de error con "Reintentar". El 400 entra
    // acá por el mismo motivo: es el id que ni siquiera tiene forma de UUID.
    if (e instanceof ApiError && (e.status === 404 || e.status === 400)) return null;
    throw e;
  }
}

/* ---- Hooks --------------------------------------------------------------- */

/**
 * Página del listado. Los filtros, el orden y el paginado los resuelve el
 * backend, así que cambiar cualquiera de ellos vuelve a pedir el listado.
 */
export function useCatalogoRecetas(consulta: ConsultaRecetas): AsyncState<Pagina<RecetaResumen>> {
  return useAsync<Pagina<RecetaResumen>>(() => listarRecetas(consulta), [
    consulta.dificultad,
    consulta.duracion,
    consulta.cultivoId,
    consulta.orden,
    consulta.page,
    consulta.size,
  ]);
}

/** Las opciones de los tres filtros, con sus contadores. */
export function useFiltrosRecetas(): AsyncState<FiltrosRecetas> {
  return useAsync<FiltrosRecetas>(listarFiltros);
}

/** Detalle de una receta. `data` en `null` significa que no existe. */
export function useRecetaDetalle(id: string): AsyncState<RecetaDetalle | null> {
  return useAsync<RecetaDetalle | null>(() => verDetalle(id), [id]);
}
