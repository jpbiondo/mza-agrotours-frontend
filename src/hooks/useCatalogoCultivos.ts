import { useAsync } from "@/hooks/useAsync";
import type { AsyncState } from "@/hooks/useAsync";
import { ApiError, apiFetch, comoEnvelope, comoPagina } from "@/lib/api";
import type { Pagina } from "@/lib/api";
import type {
  ActividadDeCultivo,
  ConsultaCultivos,
  CultivoDetalle,
  CultivoResumen,
  DatoNutricional,
  EstadoMes,
  MesEstacionalidad,
  RecetaDeCultivo,
  TotalesTemporada,
} from "@/types/cultivos";
import type { DificultadId } from "@/types/recetas";

/**
 * Catálogo de cultivos del visitante: el listado paginado, los totales con los
 * que se arma el filtro de temporada y el detalle de un cultivo.
 *
 * Todas las lecturas van **sin token**: son pantallas de `(sitio)`, que se ven
 * sin sesión. Mismo criterio que `useCatalogoEstablecimientos`.
 *
 * Ojo con el path: este es `/tipo-cultivo` (el controller del visitante), que
 * no es el `/tipos-cultivo` de `useTiposCultivo` —ese es el catálogo con token
 * que usan los formularios de panel y admin—.
 */
const BASE = "/tipo-cultivo";
const FILTRO_TEMPORADA = `${BASE}/filtros/temporada`;

/* ---- Respuestas crudas --------------------------------------------------- */

/** Item del listado. Campos opcionales: defensivo. */
interface ResumenBackend {
  id?: string;
  nombre?: string;
  resumenCosecha?: string | null;
  enTemporada?: unknown;
}

interface MesBackend {
  mes?: string;
  nombre?: string;
}

interface NutricionBackend {
  nombre?: string;
  valor?: string;
  unidad?: string;
}

interface RecetaBackend {
  id?: string;
  nombre?: string;
  tiempo?: string | null;
  porciones?: unknown;
  dificultad?: unknown;
}

interface ActividadBackend {
  id?: string;
  titulo?: string;
  nombreEstablecimiento?: string;
  nombreDepartamento?: string;
  precioRegular?: unknown;
}

interface DetalleBackend {
  id?: string;
  nombre?: string;
  descripcion?: string | null;
  beneficios?: unknown;
  calendario?: unknown;
  porcionReferencia?: string | null;
  informacionNutricional?: unknown;
  recetas?: unknown;
  actividades?: unknown;
}

interface TotalesBackend {
  totalTodos?: unknown;
  totalEnTemporada?: unknown;
  totalFueraDeTemporada?: unknown;
}

/* ---- Vocabulario del backend --------------------------------------------- */

/** Los 12 meses en el orden del enum `Mes`, con la etiqueta que va en la barra. */
const MESES: { clave: string; etiqueta: string }[] = [
  { clave: "ENERO", etiqueta: "Ene" },
  { clave: "FEBRERO", etiqueta: "Feb" },
  { clave: "MARZO", etiqueta: "Mar" },
  { clave: "ABRIL", etiqueta: "Abr" },
  { clave: "MAYO", etiqueta: "May" },
  { clave: "JUNIO", etiqueta: "Jun" },
  { clave: "JULIO", etiqueta: "Jul" },
  { clave: "AGOSTO", etiqueta: "Ago" },
  { clave: "SEPTIEMBRE", etiqueta: "Sep" },
  { clave: "OCTUBRE", etiqueta: "Oct" },
  { clave: "NOVIEMBRE", etiqueta: "Nov" },
  { clave: "DICIEMBRE", etiqueta: "Dic" },
];

/** `EstacionalidadNombre` del backend → el estado que dibuja la barra. */
const ESTADOS: Record<string, EstadoMes> = {
  COSECHA: "cosecha",
  CRECIMIENTO: "crecimiento",
  REPOSO: "reposo",
};

/** Valores del enum `Dificultad`, para descartar el que no conozcamos. */
const DIFICULTADES: DificultadId[] = ["FACIL", "MEDIA", "DIFICIL"];

/** `UnidadNutricional` del backend → el símbolo que se muestra. */
const UNIDADES: Record<string, string> = {
  KCAL: "kcal",
  GRAMOS: "g",
  MILIGRAMOS: "mg",
  MICROGRAMOS: "mcg",
  PORCENTAJE: "%",
};

/* ---- Mapeo --------------------------------------------------------------- */

function aTexto(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

function aNumero(v: unknown): number {
  return typeof v === "number" && Number.isFinite(v) ? v : 0;
}

/** El precio distingue "sin cargar" de 0, así que el `null` se conserva. */
function aNumeroOpcional(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

function aResumen(c: ResumenBackend): CultivoResumen {
  return {
    id: aTexto(c.id),
    nombre: aTexto(c.nombre),
    // Sin meses de cosecha el backend manda `null`: la tarjeta lo dice con sus
    // propias palabras en vez de mostrar un hueco.
    resumenCosecha: aTexto(c.resumenCosecha),
    enTemporada: c.enTemporada === true,
  };
}

/**
 * Calendario en el orden fijo de los 12 meses. Se arma recorriendo `MESES` y no
 * el array recibido, así el mes que no vino —o que vino con un estado que no
 * conocemos— no corre a los demás de lugar en la barra.
 */
function aCalendario(v: unknown): MesEstacionalidad[] {
  if (!Array.isArray(v)) return [];
  const porMes = new Map<string, string>();
  for (const m of v) {
    if (!m || typeof m !== "object") continue;
    const { mes, nombre } = m as MesBackend;
    if (typeof mes === "string") porMes.set(mes, aTexto(nombre));
  }
  return MESES.flatMap((mes, indice) => {
    const estado = ESTADOS[porMes.get(mes.clave) ?? ""];
    return estado ? [{ indice, etiqueta: mes.etiqueta, estado }] : [];
  });
}

/** Une valor y unidad ("69" + KCAL → "69 kcal"). Sin nombre no hay fila que mostrar. */
function aNutricion(v: unknown): DatoNutricional[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((d): d is NutricionBackend => !!d && typeof d === "object")
    .map((d) => {
      const unidad = UNIDADES[aTexto(d.unidad)] ?? "";
      const valor = aTexto(d.valor);
      return { nombre: aTexto(d.nombre), valor: unidad ? `${valor} ${unidad}` : valor };
    })
    .filter((d) => d.nombre !== "" && d.valor !== "");
}

/** La dificultad es obligatoria en el alta de la receta; si faltara, la media. */
function aReceta(r: RecetaBackend): RecetaDeCultivo {
  const dificultad = aTexto(r.dificultad);
  return {
    id: aTexto(r.id),
    nombre: aTexto(r.nombre),
    tiempo: aTexto(r.tiempo),
    porciones: aNumero(r.porciones),
    dificultad: DIFICULTADES.includes(dificultad as DificultadId)
      ? (dificultad as DificultadId)
      : "MEDIA",
  };
}

function aActividad(a: ActividadBackend): ActividadDeCultivo {
  return {
    id: aTexto(a.id),
    titulo: aTexto(a.titulo),
    establecimiento: aTexto(a.nombreEstablecimiento),
    departamento: aTexto(a.nombreDepartamento),
    precio: aNumeroOpcional(a.precioRegular),
  };
}

/** Lista de textos sueltos (los beneficios), sin los vacíos. */
function aTextos(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.map(aTexto).filter((t) => t !== "");
}

function aDetalle(d: DetalleBackend): CultivoDetalle {
  return {
    id: aTexto(d.id),
    nombre: aTexto(d.nombre),
    descripcion: aTexto(d.descripcion),
    beneficios: aTextos(d.beneficios),
    calendario: aCalendario(d.calendario),
    porcionReferencia: aTexto(d.porcionReferencia),
    informacionNutricional: aNutricion(d.informacionNutricional),
    // Sin id no se puede linkear la receta: se descarta la tarjeta.
    recetas: Array.isArray(d.recetas)
      ? d.recetas
          .filter((r): r is RecetaBackend => !!r && typeof r === "object")
          .map(aReceta)
          .filter((r) => r.id !== "")
      : [],
    // Sin id no se puede linkear la actividad: se descarta la fila.
    actividades: Array.isArray(d.actividades)
      ? d.actividades
          .filter((a): a is ActividadBackend => !!a && typeof a === "object")
          .map(aActividad)
          .filter((a) => a.id !== "")
      : [],
  };
}

function aTotales(t: TotalesBackend): TotalesTemporada {
  return {
    todos: aNumero(t.totalTodos),
    enTemporada: aNumero(t.totalEnTemporada),
    fueraDeTemporada: aNumero(t.totalFueraDeTemporada),
  };
}

/* ---- Lecturas ------------------------------------------------------------ */

/** GET público que devuelve `data`, o tira con el `code` del backend. */
async function leer<T>(path: string, mensaje: string): Promise<T | undefined> {
  const env = comoEnvelope<T>(await apiFetch<unknown>(path));
  if (!env.ok) throw new Error(env.code ?? mensaje);
  return env.data;
}

/** Query del listado. `enTemporada` sólo viaja cuando hay filtro elegido. */
function queryCultivos({ enTemporada, page, size }: ConsultaCultivos): string {
  const qs = new URLSearchParams();
  if (enTemporada !== null) qs.set("enTemporada", String(enTemporada));
  qs.set("page", String(page));
  qs.set("size", String(size));
  return `?${qs.toString()}`;
}

async function listarCultivos(consulta: ConsultaCultivos): Promise<Pagina<CultivoResumen>> {
  const data = await leer<unknown>(
    `${BASE}${queryCultivos(consulta)}`,
    "No pudimos cargar los cultivos",
  );
  // Envelope ok sin `data` es página vacía, no error. Sin id no hay a dónde
  // linkear la tarjeta, así que esa fila se descarta.
  const pagina = comoPagina<ResumenBackend>(data);
  return { ...pagina, items: pagina.items.map(aResumen).filter((c) => c.id !== "") };
}

async function verDetalle(id: string): Promise<CultivoDetalle | null> {
  try {
    const data = await leer<DetalleBackend>(
      `${BASE}/${encodeURIComponent(id)}`,
      "No pudimos cargar el cultivo",
    );
    return data ? aDetalle(data) : null;
  } catch (e) {
    // Un id que no existe no es una falla técnica: la pantalla dibuja su propio
    // "no encontrado" en vez del panel de error con "Reintentar". El 400 entra
    // acá por el mismo motivo: es el id que ni siquiera tiene forma de UUID.
    if (e instanceof ApiError && (e.status === 404 || e.status === 400)) return null;
    throw e;
  }
}

/* ---- Hooks --------------------------------------------------------------- */

/**
 * Página del listado. El filtro de temporada y el paginado los resuelve el
 * backend —"en temporada" depende del mes actual del servidor—, así que cambiar
 * cualquiera de los dos vuelve a pedir el listado.
 */
export function useCatalogoCultivos(consulta: ConsultaCultivos): AsyncState<Pagina<CultivoResumen>> {
  return useAsync<Pagina<CultivoResumen>>(() => listarCultivos(consulta), [
    consulta.enTemporada,
    consulta.page,
    consulta.size,
  ]);
}

/** Los tres contadores del filtro de temporada, en una sola lectura. */
export function useTotalesTemporada(): AsyncState<TotalesTemporada> {
  return useAsync<TotalesTemporada>(async () => {
    const data = await leer<TotalesBackend>(FILTRO_TEMPORADA, "No pudimos cargar los filtros");
    return aTotales(data ?? {});
  });
}

/** Detalle de un cultivo. `data` en `null` significa que no existe. */
export function useCultivoDetalle(id: string): AsyncState<CultivoDetalle | null> {
  return useAsync<CultivoDetalle | null>(() => verDetalle(id), [id]);
}
