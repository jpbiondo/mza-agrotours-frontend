import { cn } from "@/lib/utils";

interface TextAreaProps {
  id?: string;
  name?: string;
  value: string;
  onChange: (val: string) => void;
  onBlur?: () => void;
  ref?: React.Ref<HTMLTextAreaElement>;
  placeholder?: string;
  maxLength?: number;
  rows?: number;
  disabled?: boolean;
  className?: string;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
}

/**
 * Textarea Agrotours, hermano de <TextField>: mismo borde, aro de foco verde y
 * relleno danger en error. Escrito a mano porque es sólo presentación —shadcn no
 * aporta comportamiento acá—. Reenvía ref/onBlur/aria-* para <FormControl>.
 */
export function TextArea({
  id, name, value, onChange, onBlur, ref, placeholder, maxLength, rows = 4, disabled, className,
  "aria-invalid": ariaInvalid, "aria-describedby": describedBy,
}: TextAreaProps) {
  return (
    <textarea
      ref={ref}
      id={id}
      name={name}
      value={value}
      placeholder={placeholder}
      maxLength={maxLength}
      rows={rows}
      disabled={disabled}
      aria-invalid={ariaInvalid}
      aria-describedby={describedBy}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      className={cn(
        "min-h-[88px] w-full resize-y rounded-md border border-input bg-surface px-3.5 py-3 text-base leading-[1.55] text-fg-1 transition-colors outline-none placeholder:text-fg-3 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:bg-danger-fill aria-invalid:ring-3 aria-invalid:ring-destructive/20",
        className,
      )}
    />
  );
}
