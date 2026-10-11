/**
 * Estado actual de un reembolso de la pantalla de impagas: `impago` si el
 * productor nunca lo pagó y lo tiene que cubrir un administrador; `sistema` si
 * un administrador ya lo pagó.
 */
export type EstadoReembolso = "impago" | "sistema";

/** Un reembolso de GET /admin/reembolsos, ya mapeado en el hook. */
export interface Reembolso {
  id: string;
  estado: EstadoReembolso;
  monto: number;
  /** Cuándo se pidió el reembolso; `null` si no vino o no se pudo leer. */
  fechaPedido: Date | null;
  /** Cuándo pasó a su estado actual. */
  fechaEstado: Date | null;
  /** El establecimiento que no pagó. */
  establecimiento: string;
  /** Productor líder del establecimiento; vacío si no tiene titular. */
  productorLider: string;
}
