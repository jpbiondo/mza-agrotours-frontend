import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface TipoIdSelectProps {
  id?: string;
  name?: string;
  value: string;
  onChange: (val: string) => void;
  onBlur?: () => void;
  ref?: React.Ref<HTMLButtonElement>;
  options: readonly string[];
  placeholder?: string;
  icon?: React.ReactNode;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
}

/**
 * Select simple (pocas opciones) sobre el Select de shadcn/Base UI.
 * Reenvía ref/onBlur/aria-* para integrarse con react-hook-form (<FormControl>).
 */
export function TipoIdSelect({
  id, name, value, onChange, onBlur, ref, options, placeholder, icon,
  "aria-invalid": ariaInvalid, "aria-describedby": describedBy,
}: TipoIdSelectProps) {
  const errored = ariaInvalid === true;
  return (
    <Select
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
          "h-11 w-full rounded-md bg-surface pl-3.5 text-base",
          errored && "bg-danger-fill"
        )}
      >
        <span className="flex items-center gap-2.5">
          {icon && (
            <span
              className={cn(
                "inline-flex text-fg-3 [&>svg]:size-[18px]",
                value && "text-green-800",
                errored && "text-danger"
              )}
            >
              {icon}
            </span>
          )}
          <SelectValue placeholder={placeholder} />
        </span>
      </SelectTrigger>
      <SelectContent className="rounded-lg">
        {options.map((o) => (
          <SelectItem key={o} value={o}>
            {o}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
