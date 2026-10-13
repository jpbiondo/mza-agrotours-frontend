export type Periodo = "30d" | "6m" | "12m";

export interface Kpis {
  ocupacionPct: number;
  /** Cupos reservados (reservas pagadas o finalizadas) en el rango. */
  ocupacionFilled: number;
  /** Cupos ofertados en el rango. */
  ocupacionTotal: number;
  /** Lo que le queda al productor de las reservas confirmadas, en pesos. */
  beneficios: number;
  /** Variación contra el período anterior; `null` si el anterior no tuvo ingresos y no hay contra qué comparar. */
  beneficiosDelta: number | null;
  /** Canceladas sobre gestionadas (confirmadas + canceladas). */
  cancelacionPct: number;
  cancelacionCount: number;
}

export interface BarDatum {
  label: string;
  value: number;
  ganancia?: number;
}

export interface Serie {
  title: string;
  sub: string;
  bars: BarDatum[];
}

export interface ActividadPerf {
  id: string;
  nombre: string;
  /** Los cultivos de la actividad, ya unidos con coma. */
  cultivo: string;
  cupos: number;
  reservas: number;
  ocupacion: number;
  ingresos: number;
}

/** Rango de días, los dos extremos incluidos, como `LocalDate` ISO ("2026-10-12"). */
export interface RangoFechas {
  desde: string;
  hasta: string;
}

export interface Estadisticas {
  actual: RangoFechas;
  /** El rango contra el que se compara el beneficio; `null` si el backend no lo mandó. */
  anterior: RangoFechas | null;
  kpis: Kpis;
  serie: Serie;
  actividades: ActividadPerf[];
}
