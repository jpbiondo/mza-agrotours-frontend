import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Tone = "neutral" | "success" | "warning" | "danger" | "info";
type Size = "sm" | "lg";

const tones: Record<Tone, string> = {
  neutral: "bg-cream-tert text-fg-2",
  success: "bg-success-fill text-success-fg",
  warning: "bg-warning-fill text-warning-fg",
  danger: "bg-danger-fill text-danger-fg",
  info: "bg-info-fill text-info-fg",
};

const sizes: Record<Size, string> = {
  sm: "gap-1.5 px-3 py-1 text-xs",
  lg: "gap-[7px] px-4 py-2.5 text-sm",
};

/**
 * Píldora de estado. Deliberadamente agnóstica del dominio: recibe el `tone` ya
 * resuelto (p. ej. desde `SOL_ESTADO_META` o `ESTADO_TONE`) para que
 * `components/ui` no dependa de `src/data`. Reemplaza a los `Pill` locales que
 * cada pantalla venía repitiendo con estilos inline.
 *
 * Admite un icono como parte de `children`; hereda el color por `currentColor`.
 */
export function EstadoBadge({
  tone = "neutral",
  size = "sm",
  className,
  children,
}: {
  tone?: Tone;
  size?: Size;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-pill font-semibold whitespace-nowrap",
        tones[tone],
        sizes[size],
        className,
      )}
    >
      {children}
    </span>
  );
}
