import type { ReactNode } from "react";

type Tone = "neutral" | "success" | "warning" | "danger" | "info";

const tones: Record<Tone, string> = {
  neutral: "bg-cream-tert text-fg-2",
  success: "bg-success-fill text-success-fg",
  warning: "bg-warning-fill text-warning-fg",
  danger: "bg-danger-fill text-danger-fg",
  info: "bg-info-fill text-info-fg",
};

/**
 * Píldora de estado. Deliberadamente agnóstica del dominio: recibe el `tone` ya
 * resuelto (p. ej. desde `SOL_ESTADO_META` o `ESTADO_TONE`) para que
 * `components/ui` no dependa de `src/data`. Reemplaza a los `Pill` locales que
 * cada pantalla venía repitiendo con estilos inline.
 */
export function EstadoBadge({
  tone = "neutral",
  className = "",
  children,
}: {
  tone?: Tone;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-pill px-3 py-1 text-xs font-bold whitespace-nowrap ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
