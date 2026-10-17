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
  /** El pago que acompañó el cambio; `null` si no hubo (el `sin_devolver` inicial, un acuerdo sin pago). */
  pago: PagoDeuda | null;
}

/** Un pago con el que el establecimiento devolvió parte o toda la deuda. */
export interface PagoDeuda {
  id: string;
  monto: number;
  /** Cuándo se hizo la transacción. */
  fecha: Date | null;
  /** El método tal cual lo escribió el administrador: texto libre, no un enum. */
  metodo: string;
  /** ID de la operación en el medio que se usó. */
  idExterno: string;
  /** Cuándo se registró en el sistema. */
  fechaCarga: Date | null;
  /** Nombre del administrador que lo registró. */
  administrador: string;
}

/**
 * Cómo se resuelve una deuda: `devolucion` registra un pago y la deja parcial o
 * saldada según el monto; `acuerdo` la cierra por un monto menor, con o sin pago.
 */
export type TipoResolucionDeuda = "devolucion" | "acuerdo";

/** Lo que carga el administrador para resolver una deuda. */
export interface DatosResolverDeuda {
  tipo: TipoResolucionDeuda;
  motivo: string;
  /** Obligatorio en `devolucion`; opcional en `acuerdo`. */
  pago: { fecha: Date; monto: number; metodo: string; idExterno: string } | null;
}

/** Detalle de GET /admin/deudas/{id}: la deuda con su historial de estados. */
export interface DeudaDetalle extends Deuda {
  /** Del más viejo al más nuevo; el último es el actual. */
  historial: EstadoHistorialDeuda[];
}
