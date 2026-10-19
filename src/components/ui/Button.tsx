import { Children, forwardRef, isValidElement, useId } from "react";
import type { ButtonHTMLAttributes } from "react";
import { Loader } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Cuándo va cada una (ver docs/ui-guidelines.md):
 * - `primary`: la acción principal de una zona; una sola por zona.
 * - `neutral`: secundarias, y el "Cancelar" de un diálogo.
 * - `danger`: confirmar una acción destructiva dentro de su diálogo.
 * - `danger-outline`: disparar una acción destructiva desde la página (abre el diálogo).
 */
export type ButtonVariant = "primary" | "neutral" | "danger" | "danger-outline";
export type ButtonSize = "sm" | "md" | "lg";

/** Variantes tácticas (sombra inset inferior) equivalentes a las clases .btn-* heredadas. */
const variants: Record<ButtonVariant, string> = {
  primary:
    "border-transparent bg-green-800 text-fg-on-dark shadow-[var(--btn-tactile-primary)] hover:bg-green-700 active:translate-y-px active:bg-green-900 active:shadow-none",
  neutral:
    "border-sand bg-surface text-fg-1 shadow-[var(--btn-tactile-neutral)] hover:border-outline hover:bg-cream-tert active:translate-y-px active:shadow-none",
  danger:
    "border-transparent bg-danger text-fg-on-dark shadow-[inset_0_-2px_0_var(--danger-fg)] hover:bg-danger-hover active:translate-y-px active:shadow-none",
  // De contorno y sin relieve: una acción destructiva secundaria no tiene que
  // pesar más que la principal de la pantalla.
  "danger-outline": "border-danger bg-surface text-danger hover:bg-danger-fill active:translate-y-px",
};

const sizes: Record<ButtonSize, string> = {
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
}: { variant?: ButtonVariant; size?: ButtonSize; className?: string } = {}): string {
  return cn(BASE, variants[variant], sizes[size], className);
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /**
   * Envío en curso: el spinner reemplaza al primer ícono, la etiqueta no cambia
   * y el botón queda deshabilitado. Si el botón no tiene ícono, el spinner va
   * delante de la etiqueta.
   */
  loading?: boolean;
  /**
   * Por qué está deshabilitado. Se muestra como texto debajo del botón (no en
   * `title`, que no se ve en pantallas táctiles) y queda asociado con
   * `aria-describedby`. Sólo se dibuja si el botón está deshabilitado.
   */
  disabledReason?: string;
}

const SPINNER_SIZE: Record<ButtonSize, string> = { sm: "size-3.5", md: "size-4", lg: "size-[18px]" };

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = "primary",
    size = "md",
    className = "",
    type = "button",
    loading = false,
    disabled,
    disabledReason,
    children,
    ...props
  },
  ref,
) {
  const motivoId = useId();
  const deshabilitado = disabled || loading;
  const conMotivo = !!disabledReason && !!disabled && !loading;

  const contenido = loading ? <ConSpinner size={size}>{children}</ConSpinner> : children;

  const boton = (
    <button
      ref={ref}
      type={type}
      // `cn` y no concatenación: sin tailwind-merge, un `className` que pisa una
      // utilidad de la variante (p. ej. otro color de borde) gana o pierde según
      // el orden del CSS generado, no según el orden de las clases.
      className={buttonClasses({ variant, size, className })}
      {...props}
      disabled={deshabilitado}
      aria-busy={loading || undefined}
      aria-describedby={conMotivo ? cn(props["aria-describedby"], motivoId) : props["aria-describedby"]}
    >
      {contenido}
    </button>
  );

  if (!conMotivo) return boton;
  return (
    <span className="inline-flex max-w-full flex-col items-stretch gap-1.5">
      {boton}
      <span id={motivoId} className="text-xs leading-snug text-fg-3">
        {disabledReason}
      </span>
    </span>
  );
});

/**
 * Reemplaza el primer ícono (un elemento que no es texto) por el spinner. Así
 * "{ícono} Guardar" pasa a "{spinner} Guardar" sin que el botón cambie de ancho.
 */
function ConSpinner({ size, children }: { size: ButtonSize; children: React.ReactNode }) {
  const spinner = <Loader key="spinner" aria-hidden className={cn("spin shrink-0", SPINNER_SIZE[size])} />;
  // `toArray` les pone key a los hijos, así el reemplazo no dispara el aviso de listas sin key.
  const hijos = Children.toArray(children);
  const i = hijos.findIndex((h) => isValidElement(h));
  if (i === -1) return <>{spinner}{children}</>;
  return <>{hijos.map((h, j) => (j === i ? spinner : h))}</>;
}
