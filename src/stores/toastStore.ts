import { create } from "zustand";
import type { ToastAction, ToastData } from "@/components/ui/Toast";

export interface ToastItem extends ToastData {
  id: number;
  action?: ToastAction;
  /** Milisegundos hasta que se cierra solo. */
  duracion: number;
}

interface ToastState {
  toasts: ToastItem[];
  mostrar: (t: Omit<ToastItem, "id">) => number;
  cerrar: (id: number) => void;
}

/** Más de tres apilados tapan la pantalla: el más viejo se va. */
const MAXIMO = 3;
let siguienteId = 1;

/**
 * Cola de toasts. La escribe `notify.*` desde cualquier lado (un hook, un
 * handler) y la dibuja `<Toaster>`, montado una sola vez en el layout raíz.
 * El temporizador vive en `<Toaster>`, no acá: así se puede pausar mientras el
 * mouse está encima.
 */
export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  mostrar: (t) => {
    const id = siguienteId++;
    set((s) => ({ toasts: [...s.toasts, { ...t, id }].slice(-MAXIMO) }));
    return id;
  },
  cerrar: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));
