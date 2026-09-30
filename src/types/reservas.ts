/**
 * Agrupa los estados del backend para los filtros de "Mis reservas": `activa`
 * es la que todavía va a ocurrir (Pendiente, Pagada); `cancelada` incluye las
 * expiradas, que tampoco se van a hacer.
 */
export type CategoriaReserva = "activa" | "finalizada" | "cancelada";

/** Item de "Mis reservas" (GET /reserva/get), ya mapeado en el hook. */
export interface ReservaResumen {
  id: string;
  actividadId: string;
  actividad: string;
  establecimiento: string;
  ubicacion: string;
  /** Inicio y fin como `Date` local; `null` si el backend no las mandó o no se pudieron leer. */
  inicio: Date | null;
  fin: Date | null;
  personas: number;
  total: number;
  /** Nombre del estado tal como lo manda el backend ("Pagada", "Cancelada con reembolso"…). */
  estado: string;
}

/** Una persona de la reserva (un renglón de `detalleDTOs`). */
export interface AsistenteReserva {
  renglon: number;
  nombre: string;
  /** Nombre del rango etario tal como lo configuró la actividad ("Adulto", "Menor"…). */
  rangoEtario: string;
  subtotal: number;
}

/** Detalle de una reserva (GET /reserva/get/{uuid}), ya mapeado en el hook. */
export interface ReservaDetalle extends ReservaResumen {
  establecimientoId: string;
  /** Ordenados por renglón. */
  asistentes: AsistenteReserva[];
}
