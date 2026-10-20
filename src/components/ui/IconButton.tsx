import { forwardRef } from "react";
import type { ButtonHTMLAttributes } from "react";
import { Loader } from "lucide-react";
import { cn } from "@/lib/utils";

interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "aria-label"> {
  /** Obligatorio: es el único nombre accesible que tiene el botón. */
  "aria-label": string;
  /**
   * `bordered` para cerrar diálogos y navegar meses; `plain` dentro de barras y
   * filas; `primary` cuando el ícono es la acción principal (enviar un mensaje).
   */
  appearance?: "bordered" | "plain" | "primary";
  /** Envío en curso: el spinner reemplaza al ícono y el botón queda deshabilitado. */
  loading?: boolean;
}

const APARIENCIAS = {
  bordered:
    "border border-outline-variant bg-surface text-fg-2 hover:bg-cream-tert hover:text-fg-1 disabled:text-fg-3 disabled:hover:bg-surface",
  plain: "border-0 bg-transparent text-fg-2 hover:bg-cream-tert hover:text-fg-1 disabled:text-fg-3 disabled:hover:bg-transparent",
  primary:
    "border-0 bg-green-800 text-fg-on-dark shadow-[var(--btn-tactile-primary)] hover:bg-green-700 disabled:bg-cream-tert disabled:text-fg-3 disabled:shadow-none",
} as const;

/**
 * Botón de sólo ícono (cerrar, mes anterior / siguiente, quitar, enviar). Un
 * único tamaño, 36 px: reemplaza a los de 32, 34, 38 y 42 que convivían.
 */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { appearance = "bordered", loading = false, disabled, className, type = "button", children, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        "inline-flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-md transition-colors disabled:cursor-not-allowed [&_svg]:size-[18px]",
        APARIENCIAS[appearance],
        className,
      )}
      {...props}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
    >
      {loading ? <Loader aria-hidden className="spin" /> : children}
    </button>
  );
});
