"use client";

import { useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const DOW = ["L", "M", "M", "J", "V", "S", "D"];
const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

const p2 = (n: number) => String(n).padStart(2, "0");

/**
 * Las fechas viajan como "YYYY-MM-DD" y se arman siempre con el constructor de
 * partes, nunca con `new Date(iso)`: ese parsea en UTC y en Argentina devuelve
 * el día anterior.
 */
export function aISO(d: Date): string {
  return `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`;
}

function deISO(iso: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return null;
  return new Date(+m[1], +m[2] - 1, +m[3]);
}

export function hoyISO(): string {
  return aISO(new Date());
}

export function sumarDiasISO(iso: string, dias: number): string {
  const d = deISO(iso);
  if (!d) return iso;
  d.setDate(d.getDate() + dias);
  return aISO(d);
}

/** Muestra "dd/mm/aaaa" a partir del ISO. */
function legible(iso: string): string {
  const d = deISO(iso);
  return d ? `${p2(d.getDate())}/${p2(d.getMonth() + 1)}/${d.getFullYear()}` : "";
}

/** Grilla del mes empezando en lunes, con huecos al principio y al final. */
function grillaDelMes(y: number, m: number): (Date | null)[] {
  const celdas: (Date | null)[] = [];
  const primero = new Date(y, m, 1);
  for (let i = 0; i < (primero.getDay() + 6) % 7; i++) celdas.push(null);
  const dias = new Date(y, m + 1, 0).getDate();
  for (let d = 1; d <= dias; d++) celdas.push(new Date(y, m, d));
  while (celdas.length % 7 !== 0) celdas.push(null);
  return celdas;
}

interface DatePickerProps {
  value: string;
  onChange: (iso: string) => void;
  /** Ambos inclusive, en formato ISO. */
  min?: string;
  max?: string;
  disabled?: boolean;
  error?: boolean;
  placeholder?: string;
  "aria-label"?: string;
}

/**
 * Fecha con calendario en popover y rango permitido. A diferencia de
 * `<DateField>` —pensado para fechas de nacimiento, con el futuro cerrado—
 * este acepta cualquier ventana vía `min`/`max`, que es lo que necesita la
 * vigencia de una actividad.
 */
export function DatePicker({
  value, onChange, min, max, disabled, error, placeholder = "dd/mm/aaaa",
  "aria-label": ariaLabel,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const [vista, setVista] = useState(() => {
    const base = deISO(value) ?? deISO(min ?? "") ?? new Date();
    return { y: base.getFullYear(), m: base.getMonth() };
  });

  const hoy = hoyISO();
  const fueraDeRango = (iso: string) => (!!min && iso < min) || (!!max && iso > max);

  // Un mes se salta entero si ni su último ni su primer día entran en el rango.
  const ultimoDelAnterior = aISO(new Date(vista.y, vista.m, 0));
  const primeroDelSiguiente = aISO(new Date(vista.y, vista.m + 1, 1));
  const sinAnterior = !!min && ultimoDelAnterior < min;
  const sinSiguiente = !!max && primeroDelSiguiente > max;

  const mover = (delta: number) =>
    setVista((v) => {
      const d = new Date(v.y, v.m + delta, 1);
      return { y: d.getFullYear(), m: d.getMonth() };
    });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        disabled={disabled}
        aria-label={ariaLabel}
        aria-invalid={error || undefined}
        className={cn(
          "flex h-11 w-full items-center justify-between gap-2 rounded-md border border-input bg-surface px-3.5 text-left text-base outline-none transition-colors",
          "focus-visible:border-green-800 focus-visible:ring-3 focus-visible:ring-green-800/20",
          value ? "text-fg-1" : "text-fg-3",
          error && "border-danger bg-danger-fill",
          disabled && "cursor-not-allowed bg-cream-tert text-fg-3",
        )}
      >
        <span>{value ? legible(value) : placeholder}</span>
        <CalendarDays className={cn("size-[18px] shrink-0", disabled ? "text-fg-3" : "text-green-700")} />
      </PopoverTrigger>

      <PopoverContent align="start" className="w-[286px] gap-0 p-4">
        <div className="mb-3 flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-sm font-semibold text-fg-1">
            <CalendarDays className="size-4 text-green-800" />
            {MESES[vista.m]} {vista.y}
          </span>
          <span className="flex gap-1.5">
            <button
              type="button"
              disabled={sinAnterior}
              onClick={() => mover(-1)}
              aria-label="Mes anterior"
              className="inline-flex size-7 items-center justify-center rounded-sm border border-sand text-fg-2 transition-colors hover:bg-cream-tert disabled:cursor-not-allowed disabled:opacity-35"
            >
              <ChevronLeft className="size-[15px]" />
            </button>
            <button
              type="button"
              disabled={sinSiguiente}
              onClick={() => mover(1)}
              aria-label="Mes siguiente"
              className="inline-flex size-7 items-center justify-center rounded-sm border border-sand text-fg-2 transition-colors hover:bg-cream-tert disabled:cursor-not-allowed disabled:opacity-35"
            >
              <ChevronRight className="size-[15px]" />
            </button>
          </span>
        </div>

        <div className="grid grid-cols-7 gap-0.5">
          {DOW.map((d, i) => (
            <div key={i} className="py-1 text-center text-[10px] font-semibold text-fg-3 uppercase">
              {d}
            </div>
          ))}
          {grillaDelMes(vista.y, vista.m).map((d, i) => {
            if (!d) return <div key={i} />;
            const iso = aISO(d);
            const bloqueado = fueraDeRango(iso);
            const elegido = iso === value;
            return (
              <button
                key={i}
                type="button"
                disabled={bloqueado}
                onClick={() => {
                  onChange(iso);
                  setOpen(false);
                }}
                className={cn(
                  "aspect-square rounded-sm text-[13px] text-fg-1 transition-colors hover:bg-cream-tert",
                  iso === hoy && !elegido && "ring-1 ring-sand ring-inset",
                  elegido && "bg-green-800 font-semibold text-fg-on-dark hover:bg-green-800",
                  bloqueado && "cursor-not-allowed text-fg-3 line-through opacity-35 hover:bg-transparent",
                )}
              >
                {d.getDate()}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
