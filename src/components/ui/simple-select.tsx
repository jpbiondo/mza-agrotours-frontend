import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

/** Una opción: un string hace de valor y etiqueta a la vez. */
export type OpcionSelect = string | { value: string; label: string };

interface SimpleSelectProps {
  id?: string;
  name?: string;
  value: string;
  onChange: (val: string) => void;
  onBlur?: () => void;
  ref?: React.Ref<HTMLButtonElement>;
  options: readonly OpcionSelect[];
  placeholder?: string;
  icon?: React.ReactNode;
  className?: string;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
}

export function SimpleSelect({
  id,
  name,
  value,
  onChange,
  onBlur,
  ref,
  options,
  placeholder,
  icon,
  className,
  "aria-invalid": ariaInvalid,
  "aria-describedby": describedBy,
}: SimpleSelectProps) {
  const errored = ariaInvalid === true;
  const items = options.map((o) => (typeof o === "string" ? { value: o, label: o } : o));
  return (
    <Select
      // `items` le dice a <SelectValue> qué etiqueta pintar para el valor elegido.
      items={items}
      value={value || null}
      onValueChange={(v) => onChange((v as string) ?? "")}
    >
      <SelectTrigger
        ref={ref}
        id={id}
        name={name}
        onBlur={onBlur}
        aria-invalid={ariaInvalid}
        aria-describedby={describedBy}
        className={cn(
          "h-11! w-full rounded-md bg-surface pl-3.5 text-base",
          errored && "bg-danger-fill",
          className,
        )}
      >
        <span className="flex items-center gap-2.5">
          {icon && (
            <span
              className={cn(
                "inline-flex text-fg-3 [&>svg]:size-[18px]",
                value && "text-green-800",
                errored && "text-danger",
              )}
            >
              {icon}
            </span>
          )}
          <SelectValue placeholder={placeholder} />
        </span>
      </SelectTrigger>
      <SelectContent className="rounded-lg">
        {items.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
