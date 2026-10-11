import { create } from "zustand";
import type { ChatResumen } from "@/types/chats";

/**
 * Lo mínimo para dibujar y escribir en una conversación. Con `nuevo`, el chat
 * todavía no existe: se crea recién cuando el visitante manda el primer mensaje.
 */
export type ChatAbierto = Pick<ChatResumen, "id" | "establecimientoId" | "titulo"> & {
  nuevo?: { actividadId: string };
};

interface ChatDrawerState {
  abierto: boolean;
  /** Conversación a la vista; `null` es el listado. */
  chat: ChatAbierto | null;
  /** Abre el drawer, en una conversación o en el listado. */
  abrir: (chat?: ChatAbierto) => void;
  /** Vuelve al listado sin cerrar el drawer. */
  volver: () => void;
  cerrar: () => void;
}

/**
 * Estado del drawer de chats del visitante. Vive fuera del componente porque
 * el drawer está en el header y quien lo abre en una conversación puntual es
 * otra pantalla —el "Contactar" del detalle de una actividad—.
 *
 * Guarda la conversación entera y no sólo su id: un chat recién creado tarda
 * un momento en llegar al inbox, y con esto se puede abrir igual.
 *
 * No se persiste: al recargar, el drawer arranca cerrado.
 */
export const useChatDrawer = create<ChatDrawerState>()((set) => ({
  abierto: false,
  chat: null,
  abrir: (chat) => set({ abierto: true, chat: chat ?? null }),
  volver: () => set({ chat: null }),
  cerrar: () => set({ abierto: false, chat: null }),
}));
