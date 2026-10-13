/**
 * Agrupa los estados del backend para los filtros de "Mis reservas": `activa`
 * es la que todavía va a ocurrir (Pendiente, Pagada). Las expiradas el backend
 * no las lista; si una llega (p. ej. al abrir el detalle) cuenta como `cancelada`.
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
  /** Cuándo el visitante empezó la reserva (no el día de la actividad); `null` si no vino. */
  creada: Date | null;
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
  /** El visitante ya la valoró: sólo se valora una vez. */
  calificada: boolean;
  /**
   * El checkout de Mercado Pago de una reserva Pendiente, para reintentar el
   * pago. `null` si la reserva no lo trae (el pago no pasa por Mercado Pago, o
   * el backend todavía no lo expone).
   */
  checkout: { preferenceId: string; vence: Date } | null;
}

/** Qué pasaría si se cancela ahora (GET /reserva/cancelarReservaCondicion). */
export type CondicionCancelacion = "conReembolso" | "sinReembolso" | "desconocida";

/** Qué pasó al cancelar (POST /reserva/cancelarReserva). */
export type ResultadoCancelacion =
  | "sinReembolso"
  /** Pago manual: se devolvió en el acto. */
  | "reembolsado"
  /** Se pidió a Mercado Pago; se confirma más tarde. */
  | "reembolsoEnProceso"
  /** Mercado Pago lo rechazó: lo devuelve el establecimiento a mano. */
  | "reembolsoManual"
  | "desconocido";

/** Por qué no se pudo consultar o cancelar. `tecnico` = red, 5xx o un code que no conocemos. */
export type ErrorCancelacion = "noEncontrada" | "estadoInvalido" | "yaTermino" | "tecnico";

/** Por qué no se pudo valorar. `tecnico` = red, 5xx o un code que no conocemos. */
export type ErrorValoracion =
  | "noFinalizada"
  | "yaValorada"
  | "noEncontrada"
  /** El backend rechazó los datos (puntaje o reseña fuera de rango). */
  | "invalida"
  | "tecnico";
