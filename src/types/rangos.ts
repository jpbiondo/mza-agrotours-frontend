export interface RangoEtario {
  id: string;
  nombre: string;
  min: number;
  max: number;
  /** Sello de fecha/hora de baja, o null si está activo. */
  baja: string | null;
}

export interface Run {
  from: number;
  to: number;
}
