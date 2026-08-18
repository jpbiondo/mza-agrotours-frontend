export type EstadoDeuda = "sin_devolver" | "parcial" | "total" | "acuerdo";

export interface PagoDeuda {
  pagoId: string;
  fecha: string;
  monto: number;
}

export interface HistorialDeuda {
  estado: EstadoDeuda;
  desde: string;
  hasta: string | null;
  motivo: string;
  pago?: PagoDeuda;
}

export interface Deuda {
  id: string;
  deudor: string;
  montoTotal: number;
  montoDevuelto: number;
  estado: EstadoDeuda;
  origen: string;
  historial: HistorialDeuda[];
}
