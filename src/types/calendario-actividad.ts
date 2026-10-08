import type { DiaHorario, EstadoActividad } from "@/types/actividad-prod";
import type { CultivoRef } from "@/types/datos";
import type { DiaProgramado } from "@/types/gestion-dias";

/**
 * Personas con reserva en toda la actividad, no sólo en el mes consultado: el
 * backend cuenta una por cada detalle de reserva.
 */
export interface MetricasReservas {
  pagadas: number;
  pendientes: number;
  finalizadas: number;
}

/** Vista de consulta del calendario de una actividad (US-ACT-07). */
export interface CalendarioActividad {
  id: string;
  nombre: string;
  estado: EstadoActividad;
  establecimiento: string;
  departamento: string;
  cultivos: CultivoRef[];
  /** Días y horarios de la configuración vigente (o la próxima, o la última). */
  dias: DiaHorario[];
  metricas: MetricasReservas;
  /** Los días programados del mes consultado. */
  diasDelMes: DiaProgramado[];
}
