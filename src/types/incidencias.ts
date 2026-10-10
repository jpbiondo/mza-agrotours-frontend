export type EstadoIncidencia = "reportada" | "revision" | "resuelta" | "desestimada";

/** Una fila del listado de gestión (administración). */
export interface Incidencia {
  id: string;
  titulo: string;
  /** Nombre de quien la reportó. */
  usuario: string;
  /** Descripción recortada por el backend; la completa está en el detalle. */
  descCorta: string;
  /** `null` si el backend manda un estado que no conocemos. */
  estado: EstadoIncidencia | null;
  fechaInicio: string | null;
  fechaFin: string | null;
}

/** Lo que trae el formulario de gestión de una incidencia. */
export interface IncidenciaDetalle {
  id: string;
  titulo: string;
  desc: string;
  estado: EstadoIncidencia | null;
  fechaInicio: string | null;
  fechaFin: string | null;
  /** Estados a los que se puede pasar desde el actual. Vacío si está cerrada. */
  estadosPosibles: EstadoIncidencia[];
  /** Motivo con el que se cerró; sólo tiene sentido si está Resuelta o Desestimada. */
  motivo: string | null;
}

/** Conteos para los filtros del listado de gestión. */
export interface ConteosIncidencias {
  todas: number;
  abiertas: number;
  porEstado: Record<EstadoIncidencia, number>;
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
