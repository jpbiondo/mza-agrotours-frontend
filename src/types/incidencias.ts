export type EstadoIncidencia = "reportada" | "revision" | "resuelta" | "desestimada";

export interface Incidencia {
  id: string;
  titulo: string;
  usuario: string;
  desc: string;
  estado: EstadoIncidencia;
  fechaInicio: string;
  fechaFin: string | null;
  motivo?: string | null;
}
