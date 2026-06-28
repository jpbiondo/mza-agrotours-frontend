export type EstadoReservaProd =
  | "pendiente"
  | "pagada"
  | "cancelada_reembolso"
  | "cancelada_sin"
  | "finalizada";

export interface ParticipanteProd {
  nombre: string;
  edad: number;
}

export interface ReservaProd {
  id: string;
  actId: string;
  actividad: string;
  fecha: string;
  fechaLabel: string;
  horario: string;
  contacto: string;
  estado: EstadoReservaProd;
  /** Precio por adulto de la actividad; deriva el precio por categoría etaria. */
  precioAdulto: number;
  participantes: ParticipanteProd[];
}
