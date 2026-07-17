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
  value: string;
  onChange: (val: string) => void;
  options: readonly string[];
  placeholder?: string;
  icon?: React.ReactNode;
  error?: string | false | null;
}

/** Select simple (pocas opciones) sobre el Select de shadcn/Base UI. */
export function TipoIdSelect({
  id, value, onChange, options, placeholder, icon, error,
}: TipoIdSelectProps) {
  const errored = !!error;
  return (
    <Select
      value={value || null}
      onValueChange={(v) => onChange((v as string) ?? "")}
    >
      <SelectTrigger
        id={id}
        aria-invalid={errored}
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
