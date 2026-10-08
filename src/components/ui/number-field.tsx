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
  disabled?: boolean;
  className?: string;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
}

const BOTON =
  "flex w-[42px] shrink-0 items-center justify-center border border-sand bg-cream-tert text-fg-2 transition-colors hover:bg-outline-variantdisabled:cursor-not-allowed disabled:opacity-40";

/**
 * Entero no negativo sobre el <Input> de shadcn: sólo deja escribir dígitos y,
 * con `stepper`, suma un − y un + pegados al campo.
 * Reenvía ref/onBlur/id/aria-* al input para integrarse con `<FormControl>`.
 */
export function NumberField({
  id, name, value, onChange, onBlur, ref, stepper, min = 0, disabled, className,
  "aria-invalid": ariaInvalid, "aria-describedby": describedBy,
}: NumberFieldProps) {
  const n = value === "" ? NaN : Number(value);
  const errored = ariaInvalid === true;

  const input = (
    <Input
      ref={ref}
      id={id}
      name={name}
      inputMode="numeric"
      autoComplete="off"
      value={value}
      disabled={disabled}
      aria-invalid={ariaInvalid}
      aria-describedby={describedBy}
      onChange={(e) => onChange(e.target.value.replace(/\D/g, ""))}
      onBlur={onBlur}
      className={cn(
        "h-11 bg-surface font-mono text-base font-semibold",
        stepper ? "min-w-[60px] rounded-none text-center" : "rounded-md",
        errored && "bg-danger-fill",
        !stepper && className,
      )}
    />
  );

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
