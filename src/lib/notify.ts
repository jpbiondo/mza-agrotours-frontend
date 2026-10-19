import { useToastStore } from "@/stores/toastStore";

/**
 * API única de feedback por toast. Se puede llamar desde cualquier lado —un
 * handler, un hook— sin estado en la pantalla; la dibuja `<Toaster>`.
 *
 * Cuándo va cada una (ver docs/ui-guidelines.md, "Feedback"):
 * - `success`: una acción salió bien y el usuario sigue en la misma pantalla.
 * - `successDetailed`: ídem, con un dato para leer (nombre, fecha, cupos).
 * - `info`: salió bien, pero con algo que conviene saber (fechas descartadas).
 * - `undoable`: una acción reversible salió bien; ofrece "Deshacer".
 * - `error`: falló una acción lanzada **sin diálogo**. Si hay un diálogo
 *   abierto, el error va en un `<Alert>` adentro, no acá.
 *
 * Devuelven el id del toast, por si hay que cerrarlo antes (`notify.dismiss`).
 */

export const DURACION = {
  success: 4000,
  undoable: 6000,
  /** Más largo: hay que leer qué falló. */
  error: 7000,
} as const;

const mostrar = (...args: Parameters<ReturnType<typeof useToastStore.getState>["mostrar"]>) =>
  useToastStore.getState().mostrar(...args);

export const notify = {
  success(title: string): number {
    return mostrar({ tone: "success", title, duracion: DURACION.success });
  },

  successDetailed(title: string, sub: string): number {
    return mostrar({ tone: "success", title, sub, duracion: DURACION.success });
  },

  info(title: string, sub?: string): number {
    return mostrar({ tone: "info", title, sub, duracion: DURACION.success });
  },

  /**
   * Éxito de una acción reversible, con el botón "Deshacer". Al tocarlo se
   * cierra el toast y corre `onUndo`; si eso falla, `onUndo` avisa por su lado.
   */
  undoable(title: string, onUndo: () => void, { sub, label = "Deshacer" }: { sub?: string; label?: string } = {}): number {
    const id: number = mostrar({
      tone: "success",
      title,
      sub,
      duracion: DURACION.undoable,
      action: {
        label,
        onClick: () => {
          useToastStore.getState().cerrar(id);
          onUndo();
        },
      },
    });
    return id;
  },

  error(title: string, sub?: string): number {
    return mostrar({ tone: "danger", title, sub, duracion: DURACION.error });
  },

  dismiss(id: number): void {
    useToastStore.getState().cerrar(id);
  },
};
