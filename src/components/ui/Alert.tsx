import { AlertCircle, AlertTriangle, CheckCircle2, Info } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Cuándo va cada tono:
 * - `danger`: falló una acción (dentro del diálogo o arriba del formulario).
 * - `warning`: un estado de la pantalla bloquea algo (suspendido, sólo lectura).
 * - `info`: un estado de la pantalla que sólo informa (borrador, advertencias del guardado).
 * - `success`: el resultado se queda en la pantalla (p. ej. pago confirmado).
 */
type Tone = "danger" | "warning" | "success" | "info";

const tones: Record<Tone, { box: string; Icon: typeof AlertCircle }> = {
  danger: { box: "bg-danger-fill border-danger text-danger-fg", Icon: AlertCircle },
  warning: { box: "bg-warning-fill border-warning text-warning-fg", Icon: AlertTriangle },
  success: { box: "bg-success-fill border-success text-success-fg", Icon: CheckCircle2 },
  info: { box: "bg-info-fill border-info text-info-fg", Icon: Info },
};

/** Aviso en bloque con icono. El icono hereda el color del texto (currentColor). */
export function Alert({
  tone = "danger",
  icon,
  role,
  className = "",
  children,
}: {
  tone?: Tone;
  icon?: ReactNode;
  /**
   * Por defecto `alert` en `danger` y `status` en el resto. Un error que se
   * recalcula mientras se escribe pasa `status`: si no, interrumpe en cada tecla.
   */
  role?: "alert" | "status";
  className?: string;
  children: ReactNode;
}) {
  const { box, Icon } = tones[tone];
  return (
    <div
      // Un error se anuncia apenas aparece; los otros tonos, cuando el lector termina lo que está leyendo.
      role={role ?? (tone === "danger" ? "alert" : "status")}
      className={cn("flex items-start gap-[11px] rounded-md border p-[13px_15px]", box, className)}
    >
      <span className="mt-px shrink-0">{icon ?? <Icon size={18} />}</span>
      <div className="min-w-0 flex-1 text-[13.5px] font-medium leading-[1.45]">{children}</div>
    </div>
  );
}
