/**
 * Estado de una deuda de un establecimiento con la plataforma, que nace cuando
 * el sistema cubre un reembolso que el productor no pagó.
 */
export type EstadoDeuda = "sin_devolver" | "parcial" | "total" | "acuerdo";

/** Una deuda de GET /admin/deudas, ya mapeada en el hook. */
export interface Deuda {
  id: string;
  /** Cuándo se generó; `null` si no vino o no se pudo leer. */
  fecha: Date | null;
  /** Nombre del establecimiento que debe. */
  deudor: string;
  montoTotal: number;
  /** Lo devuelto hasta ahora, sumando todas las transacciones. */
  montoDevuelto: number;
  estado: EstadoDeuda;
}

/** Un paso del historial de la deuda. */
export interface EstadoHistorialDeuda {
  estado: EstadoDeuda;
  desde: Date | null;
  /** `null` en el estado actual. */
  hasta: Date | null;
  /** Lo que se devolvió con el cambio a este estado; 0 en el `sin_devolver` inicial. */
  montoTransaccion: number;
  /** Texto libre que explica el cambio de estado; vacío si no se cargó. */
  motivo: string;
}

/** Detalle de GET /admin/deudas/{id}: la deuda con su historial de estados. */
export interface DeudaDetalle extends Deuda {
  /** Del más viejo al más nuevo; el último es el actual. */
  historial: EstadoHistorialDeuda[];
}
