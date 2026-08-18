import { AlertCircle, AlertTriangle, CheckCircle2 } from "lucide-react";
import type { ReactNode } from "react";

type Tone = "danger" | "warning" | "success";

const tones: Record<Tone, { box: string; Icon: typeof AlertCircle }> = {
  danger: { box: "bg-danger-fill border-danger text-danger-fg", Icon: AlertCircle },
  warning: { box: "bg-warning-fill border-warning text-warning-fg", Icon: AlertTriangle },
  success: { box: "bg-success-fill border-success text-success-fg", Icon: CheckCircle2 },
};

/** Aviso en bloque con icono. El icono hereda el color del texto (currentColor). */
export function Alert({
  tone = "danger",
  icon,
  className = "",
  children,
}: {
  tone?: Tone;
  icon?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  const { box, Icon } = tones[tone];
  return (
    <div
      className={`flex items-start gap-[11px] rounded-md border p-[13px_15px] ${box} ${className}`}
    >
      <span className="mt-px shrink-0">{icon ?? <Icon size={18} />}</span>
      <div className="text-[13.5px] font-medium leading-[1.45]">{children}</div>
    </div>
  );
}
