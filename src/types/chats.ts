/* ---- Chats en tiempo real (Realtime Database) ------------------------- */

/** Fila del inbox del visitante: `chats_usuario/{uid}/{chatId}`. */
export interface ChatResumen {
  id: string;
  establecimientoId: string;
  /**
   * Nombre de la actividad tal como era al iniciar el chat (en chats viejos, el
   * del establecimiento). El nombre al día lo da `useTitulosChatsUsuario`.
   */
  titulo: string;
  /** Vacío mientras nadie escribió. */
  ultimoMensaje: string;
  /** Epoch en ms del último movimiento (o de la creación). */
  timestamp: number;
  noLeidos: number;
}

/** Fila del inbox del establecimiento: `chats_establecimiento/{establecimientoId}/{chatId}`. */
export interface ChatEstablecimientoResumen {
  id: string;
  visitanteId: string;
  /** Nombre del visitante al iniciar el chat. El nombre al día lo da `useInfoChatsEstablecimiento`. */
  titulo: string;
  /** Vacío mientras nadie escribió. */
  ultimoMensaje: string;
  /** Epoch en ms del último movimiento (o de la creación). */
  timestamp: number;
  noLeidos: number;
}

/** Quién mandó un mensaje. Son los dos valores que aceptan las reglas. */
export type TipoEmisor = "VISITANTE" | "ESTABLECIMIENTO";

/** Mensaje de `mensajes/{chatId}/{mensajeId}`. */
export interface MensajeChat {
  id: string;
  remitenteId: string;
  tipoEmisor: TipoEmisor;
  texto: string;
  /** Epoch en ms. Con la escritura local todavía sin confirmar es una estimación del SDK. */
  timestamp: number;
}
