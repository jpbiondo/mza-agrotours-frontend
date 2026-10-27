import { useCallback, useEffect, useState } from "react";
import { useAsync } from "@/hooks/useAsync";
import type { AsyncState } from "@/hooks/useAsync";
import { ApiError, apiFetch, comoEnvelope, comoPagina } from "@/lib/api";
import { aCalendario } from "@/lib/calendarioReserva";
import { leerFechaLocal } from "@/lib/format";
import type { Pagina } from "@/lib/api";
import type { CultivoRef } from "@/types/datos";
import type {
  ActividadPublica,
  ActividadResumen,
  BarraResenias,
  ConsultaActividades,
  EstablecimientoDeActividad,
  FacetasActividades,
  FaqActividad,
  FilterOption,
  FiltrosActividades,
  FotoRef,
  OpcionRangoPrecio,
  OrdenResenias,
  Resenia,
  ResumenResenias,
  TarifaActividad,
} from "@/types/catalogo";

/**
 * Catálogo público de actividades: el listado paginado del visitante, su
 * detalle y las facetas con las que se filtra (cultivos, departamentos, precio
 * y puntuación).
 *
 * Todas las lecturas van **sin token**: son pantallas de `(sitio)`, que se ven
 * sin sesión, y el backend tiene `/actividades/**` abierto salvo `/reservar`.
 * Mismo criterio que `useCatalogoEstablecimientos`.
 */
const BASE = "/actividades";
const EXPLORAR = `${BASE}/explorar`;
const DESTACADAS = `${BASE}/destacadas`;
const FILTROS = `${BASE}/filtros`;

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
  calificacionPromedio?: unknown;
  cantidadResenias?: unknown;
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
  diasActividad?: unknown;
  resumenResenias?: unknown;
  reseniasRecientes?: unknown;
  admiteReservas?: unknown;
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

/**
 * Sin `downloadUrl` no hay nada que dibujar, así que esa foto no cuenta.
 *
 * Se exporta porque el catálogo de establecimientos mapea su portada igual: los
 * dos endpoints devuelven el mismo `DTOFotosResponse`.
 */
export function aFoto(v: unknown): FotoRef | null {
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
  const e = (v ?? {}) as { id?: unknown; nombre?: unknown; departamento?: unknown; descripcion?: unknown; foto?: unknown };
  return {
    id: aTexto(e.id),
    nombre: aTexto(e.nombre),
    departamento: aTexto(e.departamento),
    descripcion: aTexto(e.descripcion),
    foto: aFoto(e.foto),
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

/** ResumenReseniasDTO. Las barras se rearman de 5 a 1 por si falta alguna. */
function aResumenResenias(v: unknown): ResumenResenias {
  const r = (v ?? {}) as { promedio?: unknown; totalResenias?: unknown; distribucion?: unknown };
  const barras = Array.isArray(r.distribucion)
    ? r.distribucion.filter((b): b is Record<string, unknown> => !!b && typeof b === "object")
    : [];
  const distribucion: BarraResenias[] = [5, 4, 3, 2, 1].map((puntaje) => {
    const b = barras.find((x) => x.puntaje === puntaje);
    return { puntaje, cantidad: aNumero(b?.cantidad), porcentaje: aNumero(b?.porcentaje) };
  });
  const total = aNumero(r.totalResenias);
  return { promedio: total > 0 ? aNumeroOpcional(r.promedio) : null, total, distribucion };
}

/** ReseniaCardDTO. Un puntaje fuera de 1–5 no se puede dibujar: esa fila se descarta. */
function aResenias(v: unknown): Resenia[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((r): r is Record<string, unknown> => !!r && typeof r === "object")
    .map((r) => ({
      autor: aTexto(r.nombreUsuario),
      fecha: leerFechaLocal(r.fechaHoraCalificacion),
      puntaje: aNumero(r.puntaje),
      texto: aTexto(r.resenia),
    }))
    .filter((r) => r.puntaje >= 1 && r.puntaje <= 5);
}

function aResumen(a: ResumenBackend): ActividadResumen {
  const cantidadResenias = aNumero(a.cantidadResenias);
  const promedio = aNumeroOpcional(a.calificacionPromedio);
  return {
    // Sin reseñas el promedio puede venir `null` o 0: los dos son "nadie
    // calificó", y un 0 no se puede mostrar como puntaje (el mínimo es 1).
    puntuacion: cantidadResenias > 0 && promedio !== null && promedio > 0 ? promedio : null,
    cantidadResenias,
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
    calendario: aCalendario(d.diasActividad),
    resenias: aResumenResenias(d.resumenResenias),
    reseniasRecientes: aResenias(d.reseniasRecientes),
    // Sólo un `false` explícito corta las reservas: si el campo no viene, el
    // backend igual rechaza la reserva y el visitante se entera en `/reservar`.
    admiteReservas: d.admiteReservas !== false,
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
 * Filtros como los toma el `FiltroActividadRequest` del backend, el mismo en
 * el listado y en la faceta. `cultivosIds` se repite una vez por cultivo, que
 * es como Spring arma el `List<UUID>`; el resto va suelto. Lo vacío se omite:
 * el backend lo trata igual que ausente (y los precios los valida `@Positive`).
 */
function paramsFiltros({ busqueda, cultivosIds, departamentoId, precio, puntuacionMin }: FiltrosActividades): URLSearchParams {
  const qs = new URLSearchParams();
  const texto = busqueda.trim();
  if (texto) qs.set("busqueda", texto);
  for (const id of cultivosIds) qs.append("cultivosIds", id);
  if (departamentoId) qs.set("departamentoId", departamentoId);
  if (precio?.desde) qs.set("precioDesde", String(precio.desde));
  if (precio?.hasta) qs.set("precioHasta", String(precio.hasta));
  if (puntuacionMin !== null) qs.set("calificacionMin", String(puntuacionMin));
  return qs;
}

/** El backend toma cada orden como un booleano "ascendente"; sin él, no ordena por eso. */
function queryExplorar(consulta: ConsultaActividades): string {
  const qs = paramsFiltros(consulta);
  if (consulta.ordenPrecio) qs.set("ascByPrecio", String(consulta.ordenPrecio === "asc"));
  if (consulta.ordenPuntuacion) qs.set("ascByCalificacion", String(consulta.ordenPuntuacion === "asc"));
  qs.set("page", String(consulta.page));
  qs.set("size", String(consulta.size));
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

/**
 * Destacadas de la landing: un array suelto (no una página) de hasta seis, con
 * el mismo DTO que `/explorar`. El criterio de selección y el orden los decide
 * el backend y van a cambiar, así que se respetan tal cual llegan.
 */
async function listarDestacadas(): Promise<ActividadResumen[]> {
  const data = await leer<unknown>(DESTACADAS, "No pudimos cargar las actividades destacadas");
  if (!Array.isArray(data)) return [];
  return data
    .filter((a): a is ResumenBackend => !!a && typeof a === "object")
    .map(aResumen)
    .filter((a) => a.id !== "");
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
function aOpciones(v: unknown): FilterOption[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((f): f is FiltroBackend => !!f && typeof f === "object")
    .map(aOpcion)
    .filter((o) => o.value !== "" && o.label !== "")
    .sort((a, b) => a.label.localeCompare(b.label, "es"));
}

/**
 * Rangos de precio en el orden en que llegan (de menor a mayor). Uno sin
 * ninguna de las dos puntas no acota nada, así que se descarta.
 */
function aRangosPrecio(v: unknown): OpcionRangoPrecio[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((r): r is Record<string, unknown> => !!r && typeof r === "object")
    .map((r) => ({ desde: aNumeroOpcional(r.desde), hasta: aNumeroOpcional(r.hasta), count: aNumero(r.cantidad) }))
    .filter((r) => r.desde !== null || r.hasta !== null);
}

/**
 * Puntuaciones mínimas, de más a menos estrellas. La etiqueta se arma acá en
 * vez de usar el `nombre` del backend, que no es texto de pantalla.
 */
function aPuntuaciones(v: unknown): FilterOption[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((f): f is FiltroBackend => !!f && typeof f === "object")
    .map((f) => ({ estrellas: Number.parseInt(aTexto(f.valor), 10), count: aNumero(f.cantidad) }))
    .filter((p) => p.estrellas >= 1 && p.estrellas <= 5)
    .sort((a, b) => b.estrellas - a.estrellas)
    .map((p) => ({ value: String(p.estrellas), label: `${p.estrellas} o más`, count: p.count }));
}

interface FacetasBackend {
  filtroCultivos?: unknown;
  filtroDepartamentos?: unknown;
  filtroPrecios?: unknown;
  filtroCalificaciones?: unknown;
}

async function listarFacetas(filtros: FiltrosActividades): Promise<FacetasActividades> {
  const qs = paramsFiltros(filtros).toString();
  const data = await leer<FacetasBackend>(`${FILTROS}${qs ? `?${qs}` : ""}`, "No pudimos cargar los filtros");
  return {
    cultivos: aOpciones(data?.filtroCultivos),
    departamentos: aOpciones(data?.filtroDepartamentos),
    precios: aRangosPrecio(data?.filtroPrecios),
    puntuaciones: aPuntuaciones(data?.filtroCalificaciones),
  };
}

/* ---- Hooks --------------------------------------------------------------- */

/**
 * Página del listado. Búsqueda, filtros, orden y paginado los resuelve el
 * backend, así que cambiar cualquiera de ellos vuelve a pedir.
 */
export function useCatalogoActividades(
  consulta: ConsultaActividades,
): AsyncState<Pagina<ActividadResumen>> {
  return useAsync<Pagina<ActividadResumen>>(() => listarActividades(consulta), [queryExplorar(consulta)]);
}

/** Actividades destacadas de la landing (GET /actividades/destacadas), de 0 a 6. */
export function useActividadesDestacadas(): AsyncState<ActividadResumen[]> {
  return useAsync<ActividadResumen[]>(listarDestacadas);
}

/** Detalle de una actividad. `data` en `null` significa que no existe. */
export function useActividadPublica(id: string): AsyncState<ActividadPublica | null> {
  return useAsync<ActividadPublica | null>(() => verDetalle(id), [id]);
}

/** Sin filtros: la faceta cuenta sobre todo el catálogo. */
export const SIN_FILTROS: FiltrosActividades = {
  busqueda: "", cultivosIds: [], departamentoId: null, precio: null, puntuacionMin: null,
};

/**
 * Las cuatro facetas del listado en un solo pedido. Cada una se cuenta con
 * todos los filtros menos el suyo, así que se vuelve a pedir cuando cambia
 * cualquiera. Los rangos de precio salen de los cuartiles de **todo** el
 * catálogo: no se corren al filtrar, sólo cambia cuántas caen en cada uno.
 */
export function useFacetasActividades(filtros: FiltrosActividades): AsyncState<FacetasActividades> {
  return useAsync<FacetasActividades>(() => listarFacetas(filtros), [paramsFiltros(filtros).toString()]);
}

/* ---- Reseñas ------------------------------------------------------------- */

/** Reseñas por pedido: el modal las va sumando de a una página al scrollear. */
const LOTE_RESENIAS = 10;

/** El backend sólo distingue "ASC"; cualquier otro valor es de la más nueva a la más vieja. */
const ORDEN_BACKEND: Record<OrdenResenias, string> = { recientes: "DESC", antiguas: "ASC" };

async function listarResenias(
  actividadId: string,
  puntaje: number | null,
  orden: OrdenResenias,
  page: number,
): Promise<Pagina<Resenia>> {
  const qs = new URLSearchParams({ orden: ORDEN_BACKEND[orden], page: String(page), size: String(LOTE_RESENIAS) });
  if (puntaje) qs.set("puntaje", String(puntaje));
  const data = await leer<unknown>(
    `${BASE}/${encodeURIComponent(actividadId)}/resenias?${qs.toString()}`,
    "No pudimos cargar las reseñas",
  );
  const pagina = comoPagina<unknown>(data);
  return { ...pagina, items: aResenias(pagina.items) };
}

interface UseReseniasReturn {
  /** Todas las cargadas hasta ahora, en el orden pedido. */
  resenias: Resenia[];
  /** Cuántas hay en total con el filtro actual; `null` hasta que llega la primera página. */
  total: number | null;
  hayMas: boolean;
  isLoading: boolean;
  error: string | null;
  /** Pide la página siguiente. No hace nada si ya está cargando o no quedan. */
  cargarMas: () => void;
  /** Vuelve a pedir la página que falló. */
  reintentar: () => void;
}

/**
 * Listado completo de reseñas de una actividad (GET /actividades/{id}/resenias),
 * filtrable por puntaje y ordenable por fecha, de a `LOTE_RESENIAS`. Cambiar el
 * filtro o el orden arranca de nuevo desde la primera página.
 *
 * Todo el estado lleva la clave del filtro con el que se pidió: así, al
 * cambiarlo, lo anterior deja de valer sin tener que resetearlo en un efecto.
 */
export function useReseniasActividad(
  actividadId: string,
  puntaje: number | null,
  orden: OrdenResenias,
): UseReseniasReturn {
  const filtro = `${actividadId}|${puntaje ?? ""}|${orden}`;
  const [cargadas, setCargadas] = useState<{ filtro: string; paginas: Resenia[][]; total: number; totalPaginas: number } | null>(null);
  /** Cuántas páginas se quieren tener para este filtro. */
  const [objetivo, setObjetivo] = useState<{ filtro: string; paginas: number } | null>(null);
  const [fallo, setFallo] = useState<{ filtro: string; pagina: number; mensaje: string } | null>(null);

  const paginas = cargadas?.filtro === filtro ? cargadas.paginas : [];
  const quiere = objetivo?.filtro === filtro ? objetivo.paginas : 1;
  const error = fallo?.filtro === filtro && fallo.pagina === paginas.length ? fallo.mensaje : null;
  const falta = paginas.length < quiere && !error;
  const total = cargadas?.filtro === filtro ? cargadas.total : null;
  const hayMas = cargadas?.filtro === filtro ? paginas.length < cargadas.totalPaginas : true;
  const siguiente = paginas.length;

  useEffect(() => {
    if (!falta) return;
    let active = true;
    listarResenias(actividadId, puntaje, orden, siguiente)
      .then((p) => {
        if (!active) return;
        setCargadas((prev) => {
          const base = prev?.filtro === filtro ? prev.paginas : [];
          // Una respuesta que llega tarde no pisa una página ya cargada.
          if (base.length !== siguiente) return prev;
          return { filtro, paginas: [...base, p.items], total: p.totalElements, totalPaginas: p.totalPages };
        });
      })
      .catch((e) => {
        if (active) setFallo({ filtro, pagina: siguiente, mensaje: e instanceof Error ? e.message : "Error inesperado" });
      });
    return () => {
      active = false;
    };
  }, [falta, actividadId, puntaje, orden, filtro, siguiente]);

  const cargarMas = useCallback(() => {
    if (falta || error || !hayMas) return;
    setObjetivo({ filtro, paginas: siguiente + 1 });
  }, [falta, error, hayMas, filtro, siguiente]);

  const reintentar = useCallback(() => setFallo(null), []);

  return {
    resenias: paginas.flat(),
    total,
    hayMas,
    isLoading: falta,
    error,
    cargarMas,
    reintentar,
  };
}
