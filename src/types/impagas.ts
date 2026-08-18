export type EstadoReembolso = "impago" | "pedido" | "reembolsado" | "sistema";

export interface PagoReembolso {
  pagoId: string;
  fecha: string;
  monto: number;
  visitante: string;
}

export interface Reembolso {
  id: string;
  estado: EstadoReembolso;
  visitante: string;
  visitanteEmail: string;
  finca: string;
  actividad: string;
  monto: number;
  fechaPedido: string;
  fechaReembolso: string | null;
  deudaId?: string;
  pago?: PagoReembolso;
}

export interface ReembolsoForm {
  monto: number;
  fecha: string;
  pagoId: string;
}
