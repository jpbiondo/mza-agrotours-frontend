import type { ReactNode } from "react";
import { create } from "zustand";

/** Lo que acepta `confirm()`: el diálogo, sin el estado de envío (para eso, `<ConfirmDialog>`). */
export interface ConfirmOptions {
  title: string;
  description?: ReactNode;
  /** El verbo de la acción ("Eliminar receta", "Cancelar día"). Nunca "Sí" ni "Confirmar". */
  confirmLabel: string;
  cancelLabel?: string;
  /** `danger` si destruye; `primary` si no. */
  tone?: "danger" | "primary";
  icon?: ReactNode;
  /** Texto que hay que escribir para habilitar la acción (sólo cuenta y establecimiento). */
  requireText?: string;
}

interface Pedido {
  id: number;
  opciones: ConfirmOptions;
  responder: (ok: boolean) => void;
}

interface ConfirmState {
  pedido: Pedido | null;
  pedir: (opciones: ConfirmOptions) => Promise<boolean>;
  responder: (ok: boolean) => void;
}

let siguienteId = 1;

/**
 * El diálogo de `confirm()`. Hay uno solo a la vez: si se pide otro con uno
 * abierto, el anterior se responde como cancelado.
 */
export const useConfirmStore = create<ConfirmState>((set, get) => ({
  pedido: null,
  pedir: (opciones) =>
    new Promise<boolean>((resolve) => {
      get().pedido?.responder(false);
      set({ pedido: { id: siguienteId++, opciones, responder: resolve } });
    }),
  responder: (ok) => {
    const p = get().pedido;
    if (!p) return;
    set({ pedido: null });
    p.responder(ok);
  },
}));
