export interface Finca {
  id: string;
  nombre: string;
  location: string;
  role: string;
  pend: number;
}

export type StatTone = "success" | "neutral";

export interface PanelStat {
  /** Clave de ícono lucide resuelta en el componente. */
  icon: "calendar-check" | "users" | "grape" | "banknote";
  label: string;
  value: string;
  delta?: string;
  tone?: StatTone;
}

export type ReservaTone = "success" | "warning" | "info" | "danger";

export interface PanelReserva {
  codigo: string;
  experiencia: string;
  fecha: string;
  cupos: string;
  estado: string;
  tone: ReservaTone;
}

export type CultivoState = "harvest" | "growing" | "rest";

export interface PanelCultivo {
  nombre: string;
  finca: string;
  state: CultivoState;
  label: string;
}

export interface DashboardData {
  saludoNombre: string;
  fincaNombre: string;
  stats: PanelStat[];
  reservas: PanelReserva[];
  cultivos: PanelCultivo[];
}
