import type { CultivoRef } from "@/types/datos";

export interface Actividad {
  id: string;
  nombre: string;
  finca: string;
  depto: string;
  cultivos: string[];
  rating: number;
  resenias: number;
  precioAdulto: number;
  tipo: string;
  tag: string | null;
  seed: number;
}

export interface Ubicacion {
  calle: string;
  localidad: string;
  provincia: string;
  zona: string;
}

export interface Contacto {
  email: string;
  telefono: string;
  web: string;
  instagram: string;
  facebook: string;
}

export interface ImagenEst {
  seed: number;
  caption: string;
}

export interface Establecimiento {
  id: string;
  nombre: string;
  razonSocial: string;
  depto: string;
  vigente: boolean;
  seed: number;
  cultivos: string[];
  descripcion: string;
  descripcionLarga: string;
  ubicacion: Ubicacion;
  contacto: Contacto;
  imagenes: ImagenEst[];
  /** IDs de actividades de @/data/actividades. */
  actividades: string[];
}

/* ---- Catálogo público de establecimientos (backend real) ------------------
   Vocabulario propio de las pantallas de visitante. Convive con
   `Establecimiento` de arriba, que todavía alimenta la landing y /explorar
   desde los mocks de `@/data/establecimientos`. */

/** Departamento tal como lo nombra el catálogo. */
export interface DepartamentoRef {
  id: string;
  nombre: string;
}

/** Item de GET /establecimientos/catalogo. */
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
  /** `null` es "todavía sin reseñas". */
  puntuacion: number | null;
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
}

/* ---- Catálogo público de actividades (backend real) -----------------------
   Lo que ven las pantallas de `/explorar`. Convive con `Actividad` de arriba,
   que todavía alimenta la landing desde los mocks de `@/data/actividades`. */

/** Archivo de object storage: la forma de `fotoPortada` y de cada `foto`. */
export interface FotoRef {
  key: string;
  nombre: string;
  /** URL absoluta servida por el backend; se puede pedir sin sesión. */
  url: string;
}

/** Item de GET /actividades/explorar. */
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
}

/**
 * Consulta de GET /actividades/explorar. Los cultivos son varios y suman (trae
 * las que trabajen **alguno** de ellos); el departamento es uno solo. La
 * `busqueda` el backend la aplica sólo sobre el **nombre de la actividad**:
 * no alcanza al establecimiento ni al departamento.
 */
export interface ConsultaActividades {
  busqueda: string;
  cultivosIds: string[];
  departamentoId: string | null;
  /** 0-based, como lo numera el `Pageable` del backend. */
  page: number;
  size: number;
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
}

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
