export interface DiaCelda {
  dia: number;
  dow: number;
  disponible: boolean;
  cupoMax: number;
  pagadas: number;
  pendientes: number;
  ocupados: number;
  libres: number;
  lleno: boolean;
  pasado: boolean;
  horario: { desde: string; hasta: string } | null;
}

export interface MesCal {
  year: number;
  month: number;
  daysInMonth: number;
  days: Record<number, DiaCelda>;
}

export interface MetricasCal {
  pagadas: number;
  pendientes: number;
  finalizadas: number;
}

export interface DiaHora {
  dia: string;
  desde: string;
  hasta: string;
}

export interface CalendarioActividad {
  meses: MesCal[];
  metricas: MetricasCal;
  dias: DiaHora[];
  cupoMax: number;
}
