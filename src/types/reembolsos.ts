/**
 * Reembolso que Mercado Pago no pudo devolver solo al cancelarse la reserva
 * (sin saldo en la cuenta del productor, o rechazo de MP). Queda pedido hasta
 * que el productor lo reintenta. Item de
 * GET /establecimientos/{id}/reembolsos/pendientes (ReembolsoGetCatalogoDTO).
 */
export interface ReembolsoPendiente {
  id: string;
  /** Cuándo se pidió por primera vez. */
  fechaPedido: Date | null;
  monto: number;
  visitante: string;
  emailVisitante: string;
  /** UUID de la reserva cancelada. `""` si no vino. */
  reservaId: string;
  /** Personas de la reserva. */
  cupos: number;
  actividad: string;
  /** Inicio del día de la actividad. */
  diaActividad: Date | null;
}

/**
 * Qué pasó al reintentar. REALIZADO y EN_PROCESO sacan el reembolso del
 * listado (el segundo lo termina de confirmar una tarea del backend);
 * RECHAZADO lo deja donde estaba.
 */
export type ResultadoReembolso = "REALIZADO" | "EN_PROCESO" | "RECHAZADO";
