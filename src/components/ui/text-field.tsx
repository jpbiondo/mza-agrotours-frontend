import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface TextFieldProps {
  id?: string;
  name?: string;
  value: string;
  onChange: (val: string) => void;
  onBlur?: () => void;
  ref?: React.Ref<HTMLInputElement>;
  icon?: React.ReactNode;
  type?: string;
  placeholder?: string;
  maxLength?: number;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  autoComplete?: string;
  rightSlot?: React.ReactNode;
  disabled?: boolean;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
}

/**
 * Input de texto Agrotours sobre el <Input> de shadcn: icono a la izquierda,
 * slot opcional a la derecha, aro de foco verde y relleno danger en error.
 * Reenvía ref/onBlur/aria-* para integrarse con react-hook-form (<FormControl>).
 */
export function TextField({
  id, name, value, onChange, onBlur, ref, icon, type = "text",
  placeholder, maxLength, inputMode, autoComplete, rightSlot, disabled,
  "aria-invalid": ariaInvalid, "aria-describedby": describedBy,
}: TextFieldProps) {
  const errored = ariaInvalid === true;
  return (
    <div className="group relative flex items-center">
      {icon && (
        <span
          className={cn(
            "pointer-events-none absolute left-3.5 inline-flex text-fg-3 transition-colors group-focus-within:text-green-800 [&>svg]:size-[18px]",
            errored && "text-danger group-focus-within:text-danger"
          )}
        >
          {icon}
        </span>
      )}
      <Input
        ref={ref}
        id={id}
        name={name}
        type={type}
        value={value}
        placeholder={placeholder}
        maxLength={maxLength}
        inputMode={inputMode}
        autoComplete={autoComplete}
        disabled={disabled}
        aria-invalid={ariaInvalid}
        aria-describedby={describedBy}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        className={cn(
          "h-11 rounded-md bg-surface text-base",
          icon && "pl-11",
          rightSlot && "pr-11",
          errored && "bg-danger-fill"
        )}
      />
      {rightSlot && <span className="absolute right-2.5 inline-flex">{rightSlot}</span>}
    </div>
  );
}

/** Botón mostrar/ocultar contraseña, pensado como rightSlot de <TextField>. */
export function EyeToggle({ shown, onToggle }: { shown: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="inline-flex cursor-pointer p-1.5 text-fg-3 hover:text-fg-2"
      aria-label={shown ? "Ocultar contraseña" : "Mostrar contraseña"}
    >
      {shown ? <EyeOff className="size-[18px]" /> : <Eye className="size-[18px]" />}
    </button>
  );
}
