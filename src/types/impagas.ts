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

/** A quién llamar o escribirle para resolver el reembolso. Vacío si no vino. */
export interface ContactoReembolso {
  nombre: string;
  telefono: string;
  email: string;
}

/** Una persona de la reserva, en el orden en que se cargó. */
export interface PersonaReembolso {
  nombre: string;
  /** `LocalDate` del backend tal cual ("1990-05-20"): se formatea con `fmtFecha`. */
  fechaNacimiento: string | null;
}

/** El pago con el que un administrador cubrió el reembolso. */
export interface PagoReembolsoSistema {
  id: string;
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

/** Lo que carga el administrador para registrar el pago de un reembolso impago. */
export interface DatosPagoReembolso {
  fecha: Date;
  metodo: string;
  idExterno: string;
}

/** Detalle de GET /admin/reembolsos/{id}: el reembolso, su reserva y los contactos. */
export interface ReembolsoDetalle extends Omit<Reembolso, "productorLider"> {
  reservaId: string;
  actividad: string;
  /** Inicio y fin del turno reservado. */
  inicio: Date | null;
  fin: Date | null;
  visitante: ContactoReembolso;
  /** `null` si el establecimiento no tiene titular. */
  productorLider: ContactoReembolso | null;
  personas: PersonaReembolso[];
  /**
   * Sólo en `sistema`. Puede ser `null` aun ahí: hasta US-RESE-10 hay reembolsos
   * cubiertos por el sistema sin el pago registrado.
   */
  pago: PagoReembolsoSistema | null;
}
