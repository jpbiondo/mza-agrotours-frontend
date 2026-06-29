export type Periodo = "30d" | "6m" | "12m";

export interface Kpis {
  ocupacionPct: number;
  ocupacionFilled: number;
  ocupacionTotal: number;
  beneficios: number;
  beneficiosDelta: number;
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
  cultivo: string;
  cupos: number;
  reservas: number;
  ocupacion: number;
  ingresos: number;
  color: string;
  icon: string;
}

export interface PeriodoMeta {
  value: Periodo;
  label: string;
  sub: string;
  rangoActual: string;
  rangoAnterior: string;
}

export interface Estadisticas {
  kpisByPeriod: Record<Periodo, Kpis>;
  seriesByPeriod: Record<Periodo, Serie>;
  actividades: ActividadPerf[];
}
