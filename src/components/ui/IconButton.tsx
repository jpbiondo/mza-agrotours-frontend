import { forwardRef } from "react";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "aria-label"> {
  /** Obligatorio: es el único nombre accesible que tiene el botón. */
  "aria-label": string;
  /** `bordered` para cerrar diálogos y navegar meses; `plain` dentro de barras y filas. */
  appearance?: "bordered" | "plain";
}

/**
 * Botón de sólo ícono (cerrar, mes anterior / siguiente, quitar). Un único
 * tamaño, 36 px: reemplaza a los de 32, 34, 38 y 42 que convivían.
 */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { appearance = "bordered", className, type = "button", children, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        "inline-flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-md text-fg-2 transition-colors hover:bg-cream-tert hover:text-fg-1 disabled:cursor-not-allowed disabled:text-fg-3 disabled:hover:bg-transparent [&_svg]:size-[18px]",
        appearance === "bordered" ? "border border-outline-variant bg-surface" : "border-0 bg-transparent",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
});
