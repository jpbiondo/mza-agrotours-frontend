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

/** Una incidencia tal como la ve quien la reportó. */
export interface IncidenciaPropia {
  id: string;
  titulo: string;
  desc: string;
  /** `null` si el backend manda un estado que no conocemos. */
  estado: EstadoIncidencia | null;
  /** ISO local, o `null` si no vino. */
  fechaInicio: string | null;
  /** Días desde el reporte, calculados por el backend. */
  dias: number | null;
  /** Respuesta del administrador: sólo en Resuelta o Desestimada. */
  motivo: string | null;
}

export interface NuevaIncidencia {
  titulo: string;
  desc: string;
}
