"use client";

import { useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const DOW = ["L", "M", "M", "J", "V", "S", "D"];
const DOW_LARGO = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
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

/* ---- Calendario del mes ------------------------------------------------- */

interface CalendarioFechasProps {
  /** Mes visible; `mes0` va de 0 a 11. Lo controla quien lo usa, para poder pedir datos por mes. */
  anio: number;
  mes0: number;
  onMover: (delta: number) => void;
  value: string;
  onChange: (iso: string) => void;
  /** Ambos inclusive, en formato ISO. */
  min?: string;
  max?: string;
  /** Fechas del rango que igual no se pueden elegir: se pintan como ocupadas, no tachadas. */
  ocupada?: (iso: string) => boolean;
  /** Una fecha de referencia —la que ya tenía algo que se mueve—: siempre elegible y marcada. */
  original?: string;
  /** Mientras llegan los datos del mes, no se elige nada. */
  cargando?: boolean;
  /** «compacto» para el popover; «amplio» para mostrarlo fijo en la pantalla. */
  tamano?: "compacto" | "amplio";
  /** Para un día no elegible: por qué. */
  tituloBloqueado?: (iso: string, motivo: "ocupada" | "fuera") => string | undefined;
}

/**
 * La grilla de un mes para elegir una fecha. Es la del `<DatePicker>`, y
 * también se usa sola, fija en una pantalla, cuando hay que ver de un vistazo
 * qué fechas están libres.
 */
export function CalendarioFechas({
  anio, mes0, onMover, value, onChange, min, max, ocupada, original, cargando, tamano = "compacto", tituloBloqueado,
}: CalendarioFechasProps) {
  const amplio = tamano === "amplio";
  const hoy = hoyISO();
  const fueraDeRango = (iso: string) => (!!min && iso < min) || (!!max && iso > max);

  // Un mes se salta entero si ni su último ni su primer día entran en el rango.
  const sinAnterior = !!min && aISO(new Date(anio, mes0, 0)) < min;
  const sinSiguiente = !!max && aISO(new Date(anio, mes0 + 1, 1)) > max;

  const nav = cn(
    "inline-flex items-center justify-center border border-sand text-fg-2 transition-colors hover:bg-cream-tert disabled:cursor-not-allowed disabled:opacity-35",
    amplio ? "size-[34px] rounded-[8px] bg-surface" : "size-7 rounded-sm",
  );

  return (
    <div>
      <div className={cn("flex items-center justify-between", amplio ? "mb-3.5" : "mb-3")}>
        <span
          className={cn(
            "flex items-center font-semibold text-fg-1",
            amplio ? "gap-2 font-display text-lg" : "gap-1.5 text-sm",
          )}
          aria-live="polite"
        >
          <CalendarDays className={cn("text-green-800", amplio ? "size-[18px]" : "size-4")} />
          {MESES[mes0]} {anio}
        </span>
        <span className="flex gap-1.5">
          <button type="button" disabled={sinAnterior} onClick={() => onMover(-1)} aria-label="Mes anterior" className={nav}>
            <ChevronLeft className={amplio ? "size-4" : "size-[15px]"} />
          </button>
          <button type="button" disabled={sinSiguiente} onClick={() => onMover(1)} aria-label="Mes siguiente" className={nav}>
            <ChevronRight className={amplio ? "size-4" : "size-[15px]"} />
          </button>
        </span>
      </div>

      <div className={cn("grid grid-cols-7", amplio ? "gap-1" : "gap-0.5")}>
        {(amplio ? DOW_LARGO : DOW).map((d, i) => (
          <div
            key={i}
            className={cn(
              "py-1 text-center font-semibold uppercase",
              amplio ? "text-[10.5px] font-bold tracking-[.06em]" : "text-[10px]",
              amplio && i >= 5 ? "text-brown-700" : "text-fg-3",
            )}
          >
            {d}
          </div>
        ))}
        {grillaDelMes(anio, mes0).map((d, i) => {
          if (!d) return <div key={i} />;
          const iso = aISO(d);
          const esOriginal = iso === original;
          const fuera = !esOriginal && fueraDeRango(iso);
          const tomada = !esOriginal && !fuera && !!ocupada?.(iso);
          const bloqueado = cargando || fuera || tomada;
          const elegido = iso === value;
          return (
            <button
              key={i}
              type="button"
              disabled={bloqueado}
              onClick={() => onChange(iso)}
              aria-pressed={elegido}
              title={fuera ? tituloBloqueado?.(iso, "fuera") : tomada ? tituloBloqueado?.(iso, "ocupada") : undefined}
              className={cn(
                "relative flex items-center justify-center text-fg-1 transition-colors",
                amplio
                  ? "h-[42px] rounded-md border border-transparent text-[14.5px] font-medium hover:bg-green-050"
                  : "aspect-square rounded-sm text-[13px] hover:bg-cream-tert",
                iso === hoy && !elegido && (amplio ? "border-green-300" : "ring-1 ring-sand ring-inset"),
                esOriginal && !elegido && "border-dashed border-brown-500",
                elegido && "border-green-800 bg-green-800 font-semibold text-fg-on-dark hover:bg-green-800",
                elegido && amplio && "font-bold shadow-[inset_0_-2px_0_var(--green-900)]",
                tomada && "cursor-not-allowed bg-cream-tert text-fg-3 opacity-80 hover:bg-cream-tert",
                (fuera || (cargando && !elegido)) && "cursor-not-allowed text-fg-3 opacity-35 hover:bg-transparent",
                fuera && "line-through",
              )}
            >
              {d.getDate()}
              {esOriginal && !elegido && amplio && (
                <span aria-hidden className="absolute bottom-1 size-1 rounded-full bg-brown-700" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ---- Selector en popover ------------------------------------------------ */

interface DatePickerProps {
  id?: string;
  value: string;
  onChange: (iso: string) => void;
  onBlur?: () => void;
  ref?: React.Ref<HTMLButtonElement>;
  /** Ambos inclusive, en formato ISO. */
  min?: string;
  max?: string;
  disabled?: boolean;
  /** Fuera de un formulario de RHF; adentro lo marca `aria-invalid` vía `<FormControl>`. */
  error?: boolean;
  placeholder?: string;
  "aria-label"?: string;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
}

/**
 * Fecha con calendario en popover y rango permitido. A diferencia de
 * `<DateField>` —pensado para fechas de nacimiento, con el futuro cerrado—
 * este acepta cualquier ventana vía `min`/`max`, que es lo que necesita la
 * vigencia de una actividad.
 * Reenvía ref/onBlur/id/aria-* al trigger para integrarse con `<FormControl>`.
 */
export function DatePicker({
  id, value, onChange, onBlur, ref, min, max, disabled, error: errorProp, placeholder = "dd/mm/aaaa",
  "aria-label": ariaLabel, "aria-invalid": ariaInvalid, "aria-describedby": describedBy,
}: DatePickerProps) {
  const error = errorProp || ariaInvalid === true;
  const [open, setOpen] = useState(false);
  const [vista, setVista] = useState(() => {
    const base = deISO(value) ?? deISO(min ?? "") ?? new Date();
    return { y: base.getFullYear(), m: base.getMonth() };
  });

  const mover = (delta: number) =>
    setVista((v) => {
      const d = new Date(v.y, v.m + delta, 1);
      return { y: d.getFullYear(), m: d.getMonth() };
    });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        ref={ref}
        id={id}
        onBlur={onBlur}
        disabled={disabled}
        aria-label={ariaLabel}
        aria-invalid={error || undefined}
        aria-describedby={describedBy}
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
        <CalendarioFechas
          anio={vista.y}
          mes0={vista.m}
          onMover={mover}
          value={value}
          onChange={(iso) => {
            onChange(iso);
            setOpen(false);
          }}
          min={min}
          max={max}
        />
      </PopoverContent>
    </Popover>
  );
}
