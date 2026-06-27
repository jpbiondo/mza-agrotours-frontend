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

export interface Establecimiento {
  id: string;
  nombre: string;
  depto: string;
  cultivos: string[];
  descripcion: string;
  seed: number;
}

export interface FaqItem {
  id: string;
  cat: string;
  q: string;
  a: string;
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
