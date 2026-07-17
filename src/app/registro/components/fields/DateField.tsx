"use client";

import { useState } from "react";
import { CalendarDays, ChevronDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

function fmtFecha(d: Date) {
  const p = (x: number) => String(x).padStart(2, "0");
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()}`;
}

interface DateFieldProps {
  value: Date | null;
  onChange: (d: Date) => void;
  error?: string | false | null;
  placeholder?: string;
}

/** Fecha con shadcn Popover + Calendar (react-day-picker). Deshabilita el futuro. */
export function DateField({
  value, onChange, error, placeholder = "Seleccioná una fecha",
}: DateFieldProps) {
  const [open, setOpen] = useState(false);
  const errored = !!error;
  const today = new Date();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        aria-invalid={errored}
        className={cn(
          "flex h-11 w-full items-center justify-between gap-2.5 rounded-md border border-input bg-surface px-3.5 text-base outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20",
          errored && "bg-danger-fill",
          value ? "text-fg-1" : "text-fg-3"
        )}
      >
        <span className="flex items-center gap-2.5">
          <CalendarDays
            className={cn(
              "size-[18px]",
              value ? "text-green-800" : errored ? "text-danger" : "text-fg-3"
            )}
          />
          {value ? fmtFecha(value) : placeholder}
        </span>
        <ChevronDown className="size-4 shrink-0 text-fg-3" />
      </PopoverTrigger>

      <PopoverContent align="start" className="w-auto p-2">
        <Calendar
          mode="single"
          selected={value ?? undefined}
          onSelect={(d) => {
            if (d) {
              onChange(d);
              setOpen(false);
            }
          }}
          defaultMonth={value ?? new Date(2000, 0, 1)}
          startMonth={new Date(1920, 0)}
          endMonth={today}
          disabled={{ after: today }}
          autoFocus
        />
      </PopoverContent>
    </Popover>
  );
}
