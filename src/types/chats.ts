export type ChatFrom = "visitor" | "productor";

export interface ChatMensaje {
  id: string;
  from: ChatFrom;
  text: string;
  time: string;
}

export interface ChatDia {
  label: string;
  date: string;
  messages: ChatMensaje[];
}

/** Conversación del lado del establecimiento (productor responde a visitantes). */
export interface EstChat {
  id: string;
  visitor: { name: string; initials: string };
  activity: { title: string; date: string; seed: number };
  reservaCode: string;
  personas: number;
  unread: number;
  lastTime: string;
  lastFrom: ChatFrom;
  lastText: string;
  days: ChatDia[];
}

/* ---- Chats en tiempo real (Realtime Database) ------------------------- */

/** Fila del inbox del visitante: `chats_usuario/{uid}/{chatId}`. */
export interface ChatResumen {
  id: string;
  establecimientoId: string;
  /** Nombre del establecimiento; lo completa el backend al iniciar el chat. */
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
