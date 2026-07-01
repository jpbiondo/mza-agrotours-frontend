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

/** Conversación del lado del visitante (consulta a un establecimiento). */
export interface VisitorChat {
  id: string;
  activity: { id: string; title: string; finca: string; loc: string; seed: number };
  unread: number;
  lastTime: string;
  lastFrom: ChatFrom;
  lastText: string;
  days: ChatDia[];
}
