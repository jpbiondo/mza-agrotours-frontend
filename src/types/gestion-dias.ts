import type { EstadoActividad } from "@/types/actividad-prod";

/** Día de la semana como lo manda y lo recibe el backend (enum `Dia`). */
export type DiaSemana = "LUNES" | "MARTES" | "MIERCOLES" | "JUEVES" | "VIERNES" | "SABADO" | "DOMINGO";

/** Fecha calendario en "YYYY-MM-DD". Nunca se pasa por `new Date(iso)`: parsea en UTC. */
export type FechaISO = string;

/** Estado de un día dictado. Sólo los dos primeros admiten cambios de cupo. */
export type EstadoDia = "activa" | "reprogramada" | "finalizada" | "cancelada";

export interface DiaProgramado {
  id: string;
  fecha: FechaISO;
  estado: EstadoDia;
  /** "HH:MM" */
  horaInicio: string;
  horaFin: string;
  cupoMax: number;
  pagadas: number;
  pendientes: number;
}

/** Un horario de una vigencia, con los días de semana en que aplica (de lunes a domingo). */
export interface HorarioVigencia {
  horaInicio: string;
  horaFin: string;
  dias: DiaSemana[];
}

/** Un período cargado por lote que cruza el mes consultado (sin recortar al mes). */
export interface VigenciaMes {
  desde: FechaISO;
  hasta: FechaISO;
  horarios: HorarioVigencia[];
}

/** Calendario de un mes: la cabecera de la actividad más sus días. */
export interface CalendarioGestion {
  id: string;
  nombre: string;
  establecimiento: string;
  /** `null` si el backend no lo manda. */
  precioBase: number | null;
  cupoBase: number;
  estado: EstadoActividad;
  /** Desde la primera hasta la última vigencia cargada; `null` sin ninguna. */
  vigenciaDesde: FechaISO | null;
  vigenciaHasta: FechaISO | null;
  vigencias: VigenciaMes[];
  dias: DiaProgramado[];
}

export interface Tarifa {
  nombre: string;
  precio: number;
}

/** Datos de referencia para abrir días: hasta cuándo se puede y qué se cobra. */
export interface ConfiguracionDias {
  fechaMaxima: FechaISO;
  ventanaDias: number;
  tarifas: Tarifa[];
}

export interface AltaDia {
  fecha: FechaISO;
  horaInicio: string;
  horaFin: string;
  cupoMax: number;
}

export interface AltaLote {
  desde: FechaISO;
  hasta: FechaISO;
  dias: DiaSemana[];
  horaInicio: string;
  horaFin: string;
  cupoMax: number;
}

/** Qué fechas crea un lote y cuáles descarta (ya tienen un día activo o su horario pasó). */
export interface PlanLote {
  aCrear: FechaISO[];
  descartadas: FechaISO[];
}
