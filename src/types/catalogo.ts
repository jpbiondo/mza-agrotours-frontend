import type { CultivoRef } from "@/types/datos";

/* ---- Catálogo público de establecimientos ---------------------------------
   Vocabulario propio de las pantallas de visitante. */

/** Departamento tal como lo nombra el catálogo. */
export interface DepartamentoRef {
  id: string;
  nombre: string;
}

/** Item de GET /establecimientos/catalogo y de /establecimientos/destacados. */
export interface EstablecimientoResumen {
  id: string;
  nombre: string;
  razonSocial: string;
  /** Puede venir vacía: el backend la manda `null` si nadie la cargó. */
  descripcion: string;
  /** `null` si el establecimiento todavía no tiene departamento cargado. */
  departamento: DepartamentoRef | null;
  /** Con id, no sólo el nombre: el filtro del catálogo viaja por id. */
  cultivos: CultivoRef[];
  cantidadActividades: number;
  /** Portada de la finca. `null` mientras el titular no haya cargado ninguna. */
  foto: FotoRef | null;
}

/**
 * Filtros del catálogo, tal como los toma GET /establecimientos/catalogo.
 * Los cultivos son varios y suman (el backend trae los que trabajen **alguno**
 * de ellos); el departamento es uno solo y acota a ese. La `busqueda` el
 * backend la aplica sólo sobre el **nombre**: no alcanza la razón social.
 */
export interface ConsultaCatalogo {
  busqueda: string;
  cultivosIds: string[];
  departamentoId: string | null;
  /** 0-based, como lo numera el `Pageable` del backend. */
  page: number;
  size: number;
}

/** Actividad ofrecida, tal como la lista el detalle de un establecimiento. */
export interface ActividadOfrecida {
  id: string;
  nombre: string;
  cultivos: string[];
  /** `null` es "todavía sin precio publicado", que no es lo mismo que $ 0. */
  precioDesde: number | null;
  /** Promedio de 1 a 5. `null` es "todavía sin reseñas". */
  puntuacion: number | null;
  cantidadResenias: number;
  /** Portada de la actividad; `null` si no tiene fotos. */
  foto: FotoRef | null;
}

/** GET /establecimientos/{id}/detalle. Los textos vacíos son campos sin cargar. */
export interface EstablecimientoPublico {
  id: string;
  nombre: string;
  razonSocial: string;
  departamento: string;
  descripcion: string;
  email: string;
  telefono: string;
  ubicacion: string;
  cultivos: string[];
  actividades: ActividadOfrecida[];
  /** Portada de la finca. `null` mientras el titular no haya cargado ninguna. */
  foto: FotoRef | null;
}

/* ---- Catálogo público de actividades --------------------------------------
   Lo que ven las pantallas de `/explorar` y las destacadas de la landing. */

/** Archivo de object storage: la forma de `fotoPortada` y de cada `foto`. */
export interface FotoRef {
  key: string;
  nombre: string;
  /** URL absoluta servida por el backend; se puede pedir sin sesión. */
  url: string;
}

/** Item de GET /actividades/explorar y de /actividades/destacadas. */
export interface ActividadResumen {
  id: string;
  nombre: string;
  /** `null` es "todavía sin precio publicado", que no es lo mismo que $ 0. */
  precioRegular: number | null;
  /** Con id, no sólo el nombre: el filtro del listado viaja por id. */
  cultivos: CultivoRef[];
  /** `null` mientras la actividad no tenga ninguna foto cargada. */
  fotoPortada: FotoRef | null;
  nombreEstablecimiento: string;
  nombreDepartamento: string;
  /** Promedio de 1 a 5. `null` es "todavía sin reseñas": no hay puntuación que mostrar. */
  puntuacion: number | null;
  cantidadResenias: number;
}

/**
 * Rango de precio de la tarifa base, `[desde, hasta)`. `null` en una punta es
 * "sin piso" o "sin techo".
 */
export interface RangoPrecio {
  desde: number | null;
  hasta: number | null;
}

export type DireccionOrden = "asc" | "desc";

/**
 * Filtros de GET /actividades/explorar y de su faceta. Los cultivos son varios
 * y suman (trae las que trabajen **alguno** de ellos); el resto acota. La
 * `busqueda` el backend la aplica sólo sobre el **nombre de la actividad**: no
 * alcanza al establecimiento ni al departamento.
 */
export interface FiltrosActividades {
  busqueda: string;
  cultivosIds: string[];
  departamentoId: string | null;
  precio: RangoPrecio | null;
  /** Estrellas enteras: trae las de promedio igual o mayor. */
  puntuacionMin: number | null;
}

/**
 * Consulta del listado: los filtros más el orden y el paginado. Con los dos
 * órdenes puestos, el backend ordena primero por precio y desempata por
 * puntuación; sin ninguno, el orden lo decide él.
 */
export interface ConsultaActividades extends FiltrosActividades {
  ordenPrecio: DireccionOrden | null;
  ordenPuntuacion: DireccionOrden | null;
  /** 0-based, como lo numera el `Pageable` del backend. */
  page: number;
  size: number;
}

/** Opción de la faceta de precio: los rangos los arma el backend por cuartiles. */
export interface OpcionRangoPrecio extends RangoPrecio {
  count: number;
}

/**
 * Facetas del listado, de GET /actividades/filtros. Cada una cuenta con todos
 * los filtros puestos menos el suyo: el número dice cuántas quedarían al elegir
 * esa opción.
 */
export interface FacetasActividades {
  cultivos: FilterOption[];
  departamentos: FilterOption[];
  precios: OpcionRangoPrecio[];
  /** `value` es la cantidad mínima de estrellas, como texto ("4"). */
  puntuaciones: FilterOption[];
}

/** Tarifa por rango etario. La base es la que se publica como "precio desde". */
export interface TarifaActividad {
  id: string;
  nombre: string;
  edadMinima: number;
  edadMaxima: number;
  precio: number;
  esBase: boolean;
}

/** Pregunta frecuente propia de la actividad, cargada por el productor. */
export interface FaqActividad {
  pregunta: string;
  respuesta: string;
}

/** El establecimiento tal como lo resume el detalle de una actividad. */
export interface EstablecimientoDeActividad {
  /** Vacío si no vino: sin id no se puede linkear su ficha. */
  id: string;
  nombre: string;
  departamento: string;
  descripcion: string;
  /** Portada del establecimiento; `null` si no tiene. */
  foto: FotoRef | null;
}

/** GET /actividades/{id}. Los textos vacíos son campos sin cargar. */
export interface ActividadPublica {
  id: string;
  nombre: string;
  cuposMax: number;
  cultivos: string[];
  fotos: FotoRef[];
  descripcion: string;
  incluye: string[];
  noIncluye: string[];
  establecimiento: EstablecimientoDeActividad;
  /** Dirección para llegar; el nombre del lugar lo repite `establecimiento`. */
  direccion: string;
  preguntasFrecuentes: FaqActividad[];
  tarifas: TarifaActividad[];
  precioRegular: number | null;
  /** Días futuros con su disponibilidad, agrupados por mes. Vacío si no hay fechas. */
  calendario: MesCalendario[];
  resenias: ResumenResenias;
  /** Las más recientes (el backend manda hasta tres), para la sección del detalle. */
  reseniasRecientes: Resenia[];
  /**
   * `false` cuando el establecimiento no tiene una cuenta de Mercado Pago
   * utilizable: la actividad se sigue mostrando, pero no se puede reservar.
   */
  admiteReservas: boolean;
}

/** Cuántas reseñas hay de un puntaje. */
export interface BarraResenias {
  puntaje: number;
  cantidad: number;
  /** 0–100, redondeado por el backend. */
  porcentaje: number;
}

/** Promedio y distribución de las reseñas de una actividad. */
export interface ResumenResenias {
  /** `null` es "todavía sin reseñas". */
  promedio: number | null;
  total: number;
  /** Siempre las cinco barras, de 5 a 1 estrellas, aunque alguna esté en 0. */
  distribucion: BarraResenias[];
}

/** Una reseña de un visitante. */
export interface Resenia {
  autor: string;
  /** `null` si el backend no la mandó o no se pudo leer. */
  fecha: Date | null;
  puntaje: number;
  /** Puede venir vacío: la reseña escrita es opcional al valorar. */
  texto: string;
}

/** Orden del listado de reseñas, por fecha de calificación. */
export type OrdenResenias = "recientes" | "antiguas";

/** Opción de un filtro de catálogo (valor + etiqueta + cantidad). */
export interface FilterOption {
  value: string;
  label: string;
  /** Opcional: los filtros que resuelve el backend no traen cuántos hay de cada uno. */
  count?: number;
}

export interface FaqItem {
  id: string;
  cat: string;
  q: string;
  a: string;
}

/** Lo que se edita de una entrada de la base de conocimiento. */
export type DatosFaq = Omit<FaqItem, "id">;

/** Resultado de una escritura sobre la base de conocimiento. `id` sólo en el alta. */
export interface ResultadoFaq {
  ok: boolean;
  code?: string;
  id?: string;
}

export interface FaqCategoria {
  id: string;
  label: string;
  /** Clave de ícono lucide. */
  icon: string;
}

/** Disponibilidad de un mes: cada día con estado y cupos. */
export interface MesCalendario {
  year: number;
  month: number;
  label: string;
  days: Record<number, { id: string; state: "disponible" | "off"; cupos: number; cupoMaximo: number; dow: number }>;
}
