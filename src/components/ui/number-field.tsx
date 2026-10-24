import { Minus, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface NumberFieldProps {
  id?: string;
  name?: string;
  /** Texto con sólo dígitos: "" es campo vacío, no 0. */
  value: string;
  onChange: (val: string) => void;
  onBlur?: () => void;
  ref?: React.Ref<HTMLInputElement>;
  /** Con botones −/+ a los costados. */
  stepper?: boolean;
  /** Tope inferior del botón −. No valida lo que se escribe a mano: eso es del esquema. */
  min?: number;
  /**
   * Con un valor, acepta además una coma y hasta esa cantidad de decimales
   * (montos). Va coma y no punto, como se escribe acá: el punto es de miles y
   * no se deja escribir, para que "4.000" no se lea como 4. No se combina con `stepper`.
   */
  decimales?: number;
  /** Unidad dentro del campo, a la derecha ("días", "%"). No se combina con `stepper`. */
  sufijo?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
}

const BOTON =
  "flex w-[42px] shrink-0 items-center justify-center border border-sand bg-cream-tert text-fg-2 transition-colors hover:bg-outline-variantdisabled:cursor-not-allowed disabled:opacity-40";

/** Deja sólo lo que el campo admite: dígitos y, con `decimales`, una coma con hasta esa cantidad detrás. */
function limpiar(valor: string, decimales: number): string {
  if (!decimales) return valor.replace(/\D/g, "");
  const [entero, ...resto] = valor.replace(/[^\d,]/g, "").split(",");
  return resto.length ? `${entero},${resto.join("").slice(0, decimales)}` : entero;
}

/**
 * Número no negativo sobre el <Input> de shadcn: sólo deja escribir dígitos (y
 * la coma decimal, con `decimales`) y, con `stepper`, suma un − y un + pegados al campo.
 * Reenvía ref/onBlur/id/aria-* al input para integrarse con `<FormControl>`.
 */
export function NumberField({
  id, name, value, onChange, onBlur, ref, stepper, min = 0, decimales = 0, sufijo, placeholder, disabled, className,
  "aria-invalid": ariaInvalid, "aria-describedby": describedBy,
}: NumberFieldProps) {
  const n = value === "" ? NaN : Number(value);
  const errored = ariaInvalid === true;

  const input = (
    <Input
      ref={ref}
      id={id}
      name={name}
      inputMode={decimales ? "decimal" : "numeric"}
      placeholder={placeholder}
      autoComplete="off"
      value={value}
      disabled={disabled}
      aria-invalid={ariaInvalid}
      aria-describedby={describedBy}
      onChange={(e) => onChange(limpiar(e.target.value, decimales))}
      onBlur={onBlur}
      className={cn(
        "h-11 bg-surface font-mono text-base font-semibold",
        stepper ? "min-w-[60px] rounded-none text-center" : "rounded-md",
        errored && "bg-danger-fill",
        sufijo && "pr-20",
        !stepper && !sufijo && className,
      )}
    />
  );

  if (!stepper && sufijo) {
    return (
      <div className={cn("relative flex items-center", className)}>
        {input}
        <span aria-hidden className="pointer-events-none absolute right-3.5 text-[13px] font-semibold text-fg-3">
          {sufijo}
        </span>
      </div>
    );
  }

  if (!stepper) return input;

  return (
    <div className={cn("flex items-stretch", className)}>
      <button
        type="button"
        aria-label="Restar uno"
        disabled={disabled || Number.isNaN(n) || n <= min}
        onClick={() => { onChange(String(Math.max(min, n - 1))); onBlur?.(); }}
        className={cn(BOTON, "rounded-l-md border-r-0")}
      >
        <Minus className="size-4" />
      </button>
      {input}
      <button
        type="button"
        aria-label="Sumar uno"
        disabled={disabled}
        onClick={() => { onChange(String(Number.isNaN(n) ? Math.max(min, 1) : n + 1)); onBlur?.(); }}
        className={cn(BOTON, "rounded-r-md border-l-0")}
      >
        <Plus className="size-4" />
      </button>
    </div>
  );
}
