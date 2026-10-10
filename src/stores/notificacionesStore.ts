import { create } from "zustand";

interface NotificacionesState {
  /** Sube cada vez que puede haber notificaciones nuevas. Sólo importa que cambie. */
  version: number;
  avisar: () => void;
}

/**
 * Aviso de "puede haber notificaciones nuevas". Lo dispara `<PushSync>` (al
 * llegar un push o al volver a la pestaña) y lo escucha `useNotificaciones`,
 * que refresca sin skeleton. Va en un store porque quien se entera y quien
 * dibuja la campana están en lugares distintos del árbol.
 */
export const useNotificacionesStore = create<NotificacionesState>((set) => ({
  version: 0,
  avisar: () => set((s) => ({ version: s.version + 1 })),
}));
