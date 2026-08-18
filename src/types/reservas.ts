export type EstadoReserva = "pendiente" | "finalizada" | "cancelada";

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
