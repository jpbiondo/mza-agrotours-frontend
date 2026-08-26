import { AlertCircle, Check, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

/** Etiqueta de campo, con el asterisco de obligatorio. */
export function FieldLabel({
  children,
  required,
  htmlFor,
}: {
  children: React.ReactNode;
  required?: boolean;
  htmlFor?: string;
}) {
  return (
    <label htmlFor={htmlFor} className="mb-[7px] block text-[13.5px] font-semibold text-fg-1">
      {children} {required && <span className="text-danger">*</span>}
    </label>
  );
}

/** Mensaje de error de un campo. No renderiza nada si no hay error. */
export function ErrorMsg({ children, className }: { children?: string; className?: string }) {
  // Un mensaje en blanco es un error que sólo marca el campo en rojo y deja el
  // texto para el renglón de al lado; no debe ocupar alto.
  if (!children || !children.trim()) return null;
  return (
    <div className={cn("err-msg mt-1.5", className)}>
      <AlertCircle className="size-[13px] shrink-0 text-danger" />
      {children}
    </div>
  );
}

/** Cuadrito de tildado. Es un `<span>`: siempre va adentro de un botón. */
export function CajaCheck({ on, className }: { on: boolean; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex size-5 shrink-0 items-center justify-center rounded-[6px] border-[1.5px] border-sand bg-surface transition-colors",
        on && "border-green-800 bg-green-800",
        className,
      )}
    >
      {on && <Check className="size-[13px] text-fg-on-dark" />}
    </span>
  );
}

/** Encabezado de un bloque dentro de un paso: pastilla con ícono, título y ayuda. */
export function BloqueHead({
  icon,
  title,
  hint,
  tone = "green",
}: {
  icon: React.ReactNode;
  title: string;
  hint?: string;
  tone?: "green" | "danger" | "info";
}) {
  const fondo = {
    green: "bg-green-050 text-green-800",
    danger: "bg-danger-fill text-danger-fg",
    info: "bg-info-fill text-info-fg",
  }[tone];
  return (
    <div className="mb-3.5 flex items-center gap-3">
      <span className={cn("inline-flex size-[34px] shrink-0 items-center justify-center rounded-[9px]", fondo)}>
        {icon}
      </span>
      <div>
        <div className="font-display text-base leading-tight font-semibold text-fg-1">{title}</div>
        {hint && <div className="mt-0.5 text-xs text-fg-3">{hint}</div>}
      </div>
    </div>
  );
}

/** Botón punteado para sumar una fila a una lista. */
export function BotonAgregar({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-3 inline-flex cursor-pointer items-center gap-[7px] rounded-md border border-dashed border-green-300 bg-green-050 px-4 py-2.5 text-[13.5px] font-semibold whitespace-nowrap text-green-800 transition-colors hover:bg-green-100"
    >
      <Plus className="size-4" />
      {children}
    </button>
  );
}
