"use client";

import { useState } from "react";
import { Clock } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const HORAS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
// De a cinco minutos: alcanza para una franja horaria y evita una lista de 60.
const MINUTOS = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, "0"));

interface TimePickerProps {
  value: string;
  onChange: (hhmm: string) => void;
  disabled?: boolean;
  error?: boolean;
  placeholder?: string;
  "aria-label"?: string;
}

/**
 * Hora en formato "HH:MM" con dos columnas en un popover. Reemplaza al
 * `<input type="time">` nativo, que en Windows abre un desplegable propio del
 * navegador y rompe el aspecto de la pantalla.
 */
export function TimePicker({
  value, onChange, disabled, error, placeholder = "--:--", "aria-label": ariaLabel,
}: TimePickerProps) {
  const [open, setOpen] = useState(false);
  const [h, m] = value ? value.split(":") : ["", ""];

  const opcion = (activa: boolean) =>
    cn(
      "rounded-sm py-1.5 text-center font-mono text-sm text-fg-1 transition-colors hover:bg-cream-tert",
      activa && "bg-green-800 font-semibold text-fg-on-dark hover:bg-green-800",
    );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        disabled={disabled}
        aria-label={ariaLabel}
        aria-invalid={error || undefined}
        className={cn(
          "flex h-11 w-full min-w-0 items-center justify-between gap-1.5 rounded-md border border-input bg-surface px-3 text-left font-mono text-sm outline-none transition-colors",
          "focus-visible:border-green-800 focus-visible:ring-3 focus-visible:ring-green-800/20",
          value ? "text-fg-1" : "text-fg-3",
          error && "border-danger bg-danger-fill",
          disabled && "cursor-not-allowed bg-cream-tert text-fg-3",
        )}
      >
        <span>{value || placeholder}</span>
        <Clock className={cn("size-4 shrink-0", disabled ? "text-fg-3" : "text-green-700")} />
      </PopoverTrigger>

      <PopoverContent align="start" className="w-auto gap-0 p-2">
        <div className="flex gap-1">
          <div className="w-14">
            <div className="pt-0.5 pb-1.5 text-center text-[10px] font-semibold tracking-[.06em] text-fg-3 uppercase">
              Hora
            </div>
            <div className="flex max-h-[168px] flex-col gap-0.5 overflow-y-auto">
              {HORAS.map((hh) => (
                <button key={hh} type="button" onClick={() => onChange(`${hh}:${m || "00"}`)} className={opcion(hh === h)}>
                  {hh}
                </button>
              ))}
            </div>
          </div>
          <div className="w-14">
            <div className="pt-0.5 pb-1.5 text-center text-[10px] font-semibold tracking-[.06em] text-fg-3 uppercase">
              Min
            </div>
            <div className="flex max-h-[168px] flex-col gap-0.5 overflow-y-auto">
              {MINUTOS.map((mm) => (
                <button key={mm} type="button" onClick={() => onChange(`${h || "00"}:${mm}`)} className={opcion(mm === m)}>
                  {mm}
                </button>
              ))}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
