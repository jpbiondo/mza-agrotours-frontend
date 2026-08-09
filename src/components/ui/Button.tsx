import { forwardRef } from "react";
import type { ButtonHTMLAttributes } from "react";

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
      className={`inline-flex cursor-pointer select-none items-center justify-center gap-2 rounded-md border font-sans font-semibold leading-none transition-[background-color,box-shadow,transform] disabled:cursor-not-allowed disabled:border-outline-variant disabled:bg-cream-tert disabled:text-fg-3 disabled:shadow-none ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    />
  );
});
