export type EstadoReserva = "pendiente" | "finalizada" | "cancelada";

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

export interface DesgloseGrupo {
  grupo: string;
  cantidad: number;
  precio: number;
}

export interface Participante {
  nombre: string;
  categoria: string;
}

export interface Reserva {
  id: string;
  titulo: string;
  finca: string;
  loc: string;
  fecha: string;
  fechaLabel: string;
  horario: string;
  personas: number;
  precioUnit: number;
  estado: EstadoReserva;
  seed: number;
  photo: string;
  incluye: string[];
  productor: string;
  direccion: string;
  desglose: DesgloseGrupo[];
  participantes: Participante[];
}
