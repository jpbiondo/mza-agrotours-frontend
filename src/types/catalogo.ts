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

/** Item de GET /establecimientos. */
export interface EstablecimientoResumen {
  id: string;
  nombre: string;
  razonSocial: string;
  /** Puede venir vacía: el backend la manda `null` si nadie la cargó. */
  descripcion: string;
  cultivos: string[];
  cantidadActividades: number;
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

export interface Resenia {
  autor: string;
  iniciales: string;
  fecha: string;
  rating: number;
  texto: string;
}

export interface PreguntaRespuesta {
  q: string;
  a: string;
}

export interface ActividadDetalle {
  id: string;
  titulo: string;
  finca: string;
  estId: string | null;
  loc: string;
  tag: string;
  tipo: string;
  cultivos: string[];
  duracion: string;
  edadPermitida: string;
  rating: number;
  totalResenias: number;
  precioDesde: number;
  precios: { infantes: number; menores: number; adultos: number };
  fotos: { seed: number; caption: string }[];
  descripcion: string[];
  incluye: string[];
  noIncluye: string[];
  establecimiento: {
    nombre: string;
    iniciales: string;
    tipo: string;
    loc: string;
    desde: number;
    generaciones: number;
    bio: string;
  };
  cancelacion: { titulo: string; bullets: string[] };
  faqs: PreguntaRespuesta[];
  resenias: Resenia[];
}

/** Categoría etaria de viajeros para la reserva. */
export interface CategoriaViajero {
  id: "infantes" | "menores" | "adultos";
  label: string;
  sub: string;
  edadMax: number;
}

/** Disponibilidad de un mes: cada día con estado y cupos. */
export interface MesCalendario {
  year: number;
  month: number;
  label: string;
  days: Record<number, { state: "disponible" | "off"; cupos: number; dow: number }>;
}
