import { AlertTriangle, CheckCircle2, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

/** `info`: salió bien pero con algo para leer (p. ej. fechas que se descartaron). */
export type ToastData = { tone: "success" | "danger" | "info"; title: string; sub?: string };

/** Botón de acción del toast (el "Deshacer" de una acción reversible). */
export interface ToastAction {
  label: string;
  onClick: () => void;
}

const TONOS = {
  success: { bg: "bg-green-800", Icon: CheckCircle2 },
  danger: { bg: "bg-danger", Icon: AlertTriangle },
  info: { bg: "bg-info", Icon: Info },
};

/**
 * La tarjeta del toast, sin posición: la apila `<Toaster>`. Para mostrar uno,
 * `notify.*` de `@/lib/notify`.
 */
export function ToastCard({
  tone,
  title,
  sub,
  action,
  onClose,
  className,
}: ToastData & { action?: ToastAction; onClose?: () => void; className?: string }) {
  const { bg, Icon } = TONOS[tone];
  return (
    <div
      // Un error interrumpe al lector de pantalla; un éxito espera su turno.
      role={tone === "danger" ? "alert" : "status"}
      className={cn(
        "pop flex w-full max-w-100 items-start gap-2.75 rounded-md p-[14px_18px] text-fg-on-dark shadow-pop",
        bg,
        className,
      )}
    >
      <Icon size={19} className="mt-px shrink-0" aria-hidden />
      <div className="min-w-0 flex-1">
        <div className="text-[14.5px] font-semibold">{title}</div>
        {sub && <div className="mt-0.5 font-mono text-[13px] opacity-90">{sub}</div>}
      </div>
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="shrink-0 cursor-pointer rounded-sm border border-fg-on-dark/60 bg-transparent px-2.5 py-1 text-[13px] font-semibold text-fg-on-dark hover:bg-fg-on-dark/15"
        >
          {action.label}
        </button>
      )}
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar aviso"
          className="-mt-0.5 -mr-1.5 inline-flex shrink-0 cursor-pointer rounded-sm border-0 bg-transparent p-1 text-fg-on-dark/80 hover:text-fg-on-dark"
        >
          <X size={16} aria-hidden />
        </button>
      )}
    </div>
  );
}

/**
 * Toast suelto, con su propia posición (abajo a la derecha).
 *
 * @deprecated Para pantallas nuevas, `notify.*` de `@/lib/notify`: no hace
 * falta estado ni `setTimeout` en la pantalla. Queda hasta migrar los usos.
 */
export function Toast({ tone, title, sub }: ToastData) {
  return (
    <div className="fixed right-6 bottom-6 z-150">
      <ToastCard tone={tone} title={title} sub={sub} />
    </div>
  );
}
