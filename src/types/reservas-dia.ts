import type { CultivoRef } from "@/types/datos";
import type { EstadoDia, FechaISO } from "@/types/gestion-dias";

/** Estado de una reserva tal como lo muestra el productor. */
export type EstadoReservaDia =
  | "pendiente"
  | "pagada"
  | "cancelada_con_reembolso"
  | "cancelada_sin_reembolso"
  | "finalizada"
  | "expirada";

/** Cabecera de la pantalla: la actividad y el día elegido. */
export interface ResumenDia {
  actividadId: string;
  nombre: string;
  estadoDia: EstadoDia;
  /** Por qué el día está en su estado actual. Sólo tiene sentido si está cancelado o reprogramado. */
  motivoEstado: string;
  cultivos: CultivoRef[];
  establecimiento: string;
  departamento: string;
  fecha: FechaISO;
  /** "HH:MM" */
  horaInicio: string;
  horaFin: string;
  /**
   * Pagadas, finalizadas y canceladas sin reembolso: lo que el productor cobra,
   * ya sin comisiones (suma `subtotalProductor`).
   */
  ingresoEstimado: number;
  /** Reservas visibles para el productor, en cualquier estado. */
  totalReservas: number;
}

export interface VisitanteReserva {
  nombre: string;
  /** El rango etario de la tarifa, p. ej. "Adulto". */
  tipo: string;
  /** Edad que tiene el día de la actividad. */
  edad: number;
}

export interface ReservaDia {
  id: string;
  estado: EstadoReservaDia;
  personas: number;
  rangos: { rango: string; cantidad: number }[];
  visitantes: VisitanteReserva[];
  total: number;
  /**
   * Lo que retiene la plataforma, guardado al pagar con el porcentaje de ese
   * momento. `null` mientras la reserva no tiene pago.
   */
  comisionSistema: number | null;
  /** Lo que cobró Mercado Pago. `null` hasta que se aprueba el pago; `0` en un pago manual. */
  comisionTransaccion: number | null;
  /** Lo que le queda al productor: total menos las dos comisiones. */
  neto: number | null;
}

/** Cuántas reservas del día hay en cada estado (sólo los que tienen alguna). */
export type ConteoEstados = Partial<Record<EstadoReservaDia, number>>;

/** Nueva fecha y horario de un día. Con «sólo la hora» la fecha es la que ya tenía. */
export interface Reprogramacion {
  fecha: FechaISO;
  /** "HH:MM" */
  horaInicio: string;
  horaFin: string;
  motivo: string;
}
