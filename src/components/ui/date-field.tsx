"use client";

import { useState } from "react";
import {
  CalendarDays,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const DIAS_SEMANA = ["Lu", "Ma", "Mi", "Ju", "Vi", "Sá", "Do"];
const MESES_LARGOS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

function fmtFecha(d: Date) {
  const p = (x: number) => String(x).padStart(2, "0");
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()}`;
}

/** Lunes = 0 … Domingo = 6 (JS usa Domingo = 0). */
function mondayIndex(jsDay: number) {
  return (jsDay + 6) % 7;
}

interface DateFieldProps {
  id?: string;
  name?: string;
  value: Date | null;
  onChange: (d: Date) => void;
  onBlur?: () => void;
  ref?: React.Ref<HTMLButtonElement>;
  placeholder?: string;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
}

const NAV_BTN =
  "inline-flex size-8 items-center justify-center rounded-md border border-outline-variant bg-surface text-fg-2 transition-colors hover:bg-cream-tert";

/**
 * Fecha con shadcn Popover + calendario propio (grilla mensual estilo Agrotours):
 * semana desde lunes, selector de año, día seleccionado en verde, futuro deshabilitado.
 * Reenvía ref/onBlur/aria-* para integrarse con react-hook-form (<FormControl>).
 */
export function DateField({
  id, name, value, onChange, onBlur, ref, placeholder = "Seleccioná una fecha",
  "aria-invalid": ariaInvalid, "aria-describedby": describedBy,
}: DateFieldProps) {
  const [open, setOpen] = useState(false);
  const [yearMode, setYearMode] = useState(false);
  const today = new Date();
  const [view, setView] = useState(() => value ?? new Date(2000, 0, 1));
  const errored = ariaInvalid === true;

  const y = view.getFullYear();
  const m = view.getMonth();
  const firstDay = mondayIndex(new Date(y, m, 1).getDay());
  const daysInMonth = new Date(y, m + 1, 0).getDate();

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const selDay =
    value && value.getFullYear() === y && value.getMonth() === m
      ? value.getDate()
      : null;
  const isFuture = (d: number) => new Date(y, m, d) > today;

  const goMonth = (delta: number) => {
    let nm = m + delta;
    let ny = y;
    if (nm < 0) { nm = 11; ny--; } else if (nm > 11) { nm = 0; ny++; }
    setView(new Date(ny, nm, 1));
  };

  const limit = today.getFullYear();
  const years: number[] = [];
  for (let yr = limit; yr >= limit - 100; yr--) years.push(yr);

  return (
    <Popover
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) setYearMode(false);
      }}
    >
      <PopoverTrigger
        ref={ref}
        id={id}
        name={name}
        onBlur={onBlur}
        aria-invalid={ariaInvalid}
        aria-describedby={describedBy}
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

      <PopoverContent align="start" className="w-80 p-4">
        <div className="mb-3 flex items-center justify-between">
          <button type="button" onClick={() => goMonth(-1)} className={NAV_BTN}>
            <ChevronLeft className="size-[18px]" />
          </button>
          <button
            type="button"
            onClick={() => setYearMode((v) => !v)}
            className="inline-flex cursor-pointer items-center gap-1.5 font-display text-[15.5px] font-semibold text-fg-1"
          >
            {MESES_LARGOS[m]} {y}
            {yearMode ? (
              <ChevronUp className="size-[15px] text-fg-3" />
            ) : (
              <ChevronDown className="size-[15px] text-fg-3" />
            )}
          </button>
          <button type="button" onClick={() => goMonth(1)} className={NAV_BTN}>
            <ChevronRight className="size-[18px]" />
          </button>
        </div>

        {yearMode ? (
          <div className="grid max-h-60 grid-cols-4 gap-1.5 overflow-y-auto">
            {years.map((yr) => (
              <button
                key={yr}
                type="button"
                onClick={() => {
                  setView(new Date(yr, m, 1));
                  setYearMode(false);
                }}
                className={cn(
                  "cursor-pointer rounded-md py-2 font-mono text-[13.5px] transition-colors",
                  yr === y
                    ? "bg-green-800 font-bold text-white"
                    : "font-medium text-fg-2 hover:bg-green-050"
                )}
              >
                {yr}
              </button>
            ))}
          </div>
        ) : (
          <>
            <div className="mb-1.5 grid grid-cols-7 gap-0.5">
              {DIAS_SEMANA.map((d) => (
                <div
                  key={d}
                  className="py-1 text-center text-[11px] font-bold tracking-wide text-fg-3 uppercase"
                >
                  {d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-0.5">
              {cells.map((d, i) => {
                if (d === null) return <div key={i} />;
                const sel = d === selDay;
                const future = isFuture(d);
                return (
                  <button
                    key={i}
                    type="button"
                    disabled={future}
                    onClick={() => {
                      onChange(new Date(y, m, d));
                      setOpen(false);
                    }}
                    className={cn(
                      "aspect-square rounded-md text-[13.5px] transition-colors",
                      future
                        ? "cursor-not-allowed text-fg-3 opacity-35"
                        : sel
                        ? "bg-green-800 font-bold text-white"
                        : "cursor-pointer font-medium text-fg-1 hover:bg-green-050"
                    )}
                  >
                    {d}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
