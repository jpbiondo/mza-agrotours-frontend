import { forwardRef } from "react";
import type { ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type Variant = "primary" | "neutral" | "danger";
type Size = "sm" | "md" | "lg";

/** Variantes tácticas (sombra inset inferior) equivalentes a las clases .btn-* heredadas. */
const variants: Record<Variant, string> = {
  primary:
    "border-transparent bg-green-800 text-fg-on-dark shadow-[var(--btn-tactile-primary)] hover:bg-green-700 active:translate-y-px active:bg-green-900 active:shadow-none",
  neutral:
    "border-sand bg-surface text-fg-1 shadow-[var(--btn-tactile-neutral)] hover:border-outline hover:bg-cream-tert active:translate-y-px active:shadow-none",
  danger:
    "border-transparent bg-danger text-white shadow-[inset_0_-2px_0_var(--danger-fg)] active:translate-y-px active:shadow-none",
};

const sizes: Record<Size, string> = {
  sm: "px-3 py-2 text-xs",
  md: "px-[18px] py-3 text-sm",
  lg: "px-6 py-[15px] text-base",
};

const BASE =
  "inline-flex cursor-pointer select-none items-center justify-center gap-2 rounded-md border font-sans font-semibold leading-none no-underline transition-[background-color,box-shadow,transform] disabled:cursor-not-allowed disabled:border-outline-variant disabled:bg-cream-tert disabled:text-fg-3 disabled:shadow-none";

/**
 * Las clases del botón, para pintar como botón algo que no lo es —un `<Link>`,
 * sobre todo—. Un `<button>` envolviendo un `<a>` no es HTML válido y rompe la
 * navegación, así que el link se estila en vez de envolverse.
 */
export function buttonClasses({
  variant = "primary",
  size = "md",
  className = "",
}: { variant?: Variant; size?: Size; className?: string } = {}): string {
  return cn(BASE, variants[variant], sizes[size], className);
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", className = "", type = "button", ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      // `cn` y no concatenación: sin tailwind-merge, un `className` que pisa una
      // utilidad de la variante (p. ej. otro color de borde) gana o pierde según
      // el orden del CSS generado, no según el orden de las clases.
      className={buttonClasses({ variant, size, className })}
      {...props}
    />
  );
});
