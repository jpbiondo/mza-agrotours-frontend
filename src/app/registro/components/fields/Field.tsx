import { AlertCircle } from "lucide-react";
import { Label } from "@/components/ui/label";

interface FieldProps {
  label: string;
  required?: boolean;
  optional?: boolean;
  error?: string | false | null;
  hint?: string;
  htmlFor?: string;
  children: React.ReactNode;
}

/** Envoltura de campo: label + control + (error | hint). Register-only, sobre shadcn. */
export function Field({ label, required, optional, error, hint, children, htmlFor }: FieldProps) {
  return (
    <div className="flex flex-col gap-[7px]">
      <Label htmlFor={htmlFor} className="gap-1.5 text-[13.5px] text-fg-1">
        {label}
        {required && <span className="text-danger">*</span>}
        {optional && (
          <span className="text-[11.5px] font-medium text-fg-3 italic">(opcional)</span>
        )}
      </Label>
      {children}
      {error ? (
        <div className="flex items-center gap-1.5 text-[12.5px] text-danger-fg">
          <AlertCircle className="size-3.5 shrink-0" />
          {error}
        </div>
      ) : hint ? (
        <div className="text-xs text-fg-3">{hint}</div>
      ) : null}
    </div>
  );
}
