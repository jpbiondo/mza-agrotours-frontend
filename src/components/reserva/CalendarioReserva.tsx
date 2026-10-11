"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { NOMBRES_DIA } from "@/data/calendario";
import { cn } from "@/lib/utils";
import type { MesCalendario } from "@/types/catalogo";

/** Día elegido: mes (índice en `meses`) y número de día. */
export interface DiaSeleccionado {
  monthIdx: number;
  day: number;
}

/**
 * Calendario mensual de días reservables. Lo usan el widget del detalle y la
 * pantalla de reserva. Los días sin cupo y los que no tienen fecha cargada se
 * ven igual, apagados: al visitante no le cambia nada por qué no puede ir.
 *
 * Es controlado: el mes visible y el día elegido los tiene quien lo usa, así
 * puede preseleccionar uno o leer el elegido sin callbacks extra.
 */
export function CalendarioReserva({
  meses, monthIdx, onMonth, seleccionado, onSelect, leyenda = true, tactil = false,
}: {
  meses: MesCalendario[];
  monthIdx: number;
  onMonth: (i: number) => void;
  seleccionado: DiaSeleccionado | null;
  onSelect: (d: DiaSeleccionado) => void;
  leyenda?: boolean;
  /** Blancos de 44px para pantallas táctiles (navegación y celdas). */
  tactil?: boolean;
}) {
  const mes = meses[monthIdx];
  // La grilla arranca en lunes; `getDay()` cuenta desde el domingo.
  const blancos = (new Date(mes.year, mes.month, 1).getDay() + 6) % 7;
  const diasDelMes = new Date(mes.year, mes.month + 1, 0).getDate();
  const celdas: (number | null)[] = [
    ...Array<null>(blancos).fill(null),
    ...Array.from({ length: diasDelMes }, (_, i) => i + 1),
  ];
  const primero = monthIdx === 0;
  const ultimo = monthIdx === meses.length - 1;

  return (
    <div>
      <div className="mb-3.5 flex items-center justify-between">
        <NavMes onClick={() => onMonth(monthIdx - 1)} disabled={primero} label="Mes anterior" tactil={tactil}>
          <ChevronLeft size={16} aria-hidden />
        </NavMes>
        <div className="font-display text-base font-semibold text-fg-1" aria-live="polite">{mes.label}</div>
        <NavMes onClick={() => onMonth(monthIdx + 1)} disabled={ultimo} label="Mes siguiente" tactil={tactil}>
          <ChevronRight size={16} aria-hidden />
        </NavMes>
      </div>

      <div className="mb-1.5 grid grid-cols-7 gap-1">
        {NOMBRES_DIA.map((n) => (
          <div key={n} className="py-1 text-center text-[10.5px] font-semibold uppercase tracking-[.06em] text-fg-3">{n}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {celdas.map((d, idx) => {
          if (d === null) return <div key={`b${idx}`} />;
          const info = mes.days[d];
          const disponible = info?.state === "disponible";
          const sel = seleccionado?.monthIdx === monthIdx && seleccionado.day === d;
          return (
            <button
              key={d}
              type="button"
              disabled={!disponible}
              onClick={() => onSelect({ monthIdx, day: d })}
              aria-pressed={sel}
              aria-label={`${d} de ${mes.label}${disponible ? `, ${info.cupos} cupos disponibles` : ", sin cupos"}`}
              title={disponible ? `${info.cupos} cupos disponibles` : "Sin cupos disponibles"}
              className={cn(
                tactil && "min-h-11",
                "flex aspect-square w-full items-center justify-center rounded-md p-0 font-sans text-sm leading-none transition-[background-color,border-color,transform] duration-100",
                sel && "cursor-pointer border-0 bg-green-800 font-bold text-white shadow-[inset_0_-2px_0_var(--green-900)]",
                !sel && disponible && "cursor-pointer border border-green-300 bg-green-050 font-semibold text-fg-1 hover:border-green-600 active:scale-95",
                !disponible && "cursor-not-allowed border-0 bg-transparent font-normal text-fg-3 opacity-45",
              )}
            >
              {d}
            </button>
          );
        })}
      </div>

      {leyenda && (
        <div className="mt-3.5 flex flex-wrap justify-center gap-3.5">
          <Leyenda className="border border-green-300 bg-green-050">Disponible</Leyenda>
          <Leyenda className="bg-green-800">Seleccionado</Leyenda>
          <Leyenda className="border border-dashed border-outline-variant">Sin cupos</Leyenda>
        </div>
      )}
    </div>
  );
}

function NavMes({ onClick, disabled, label, tactil, children }: {
  onClick: () => void;
  disabled: boolean;
  label: string;
  tactil: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={cn(
        "flex cursor-pointer items-center justify-center rounded-md border border-outline-variant bg-surface text-fg-1 transition-colors hover:bg-cream-tert disabled:cursor-not-allowed disabled:border-cream-tert disabled:bg-cream-tert disabled:text-fg-3",
        tactil ? "size-11" : "size-8",
      )}
    >
      {children}
    </button>
  );
}

function Leyenda({ className, children }: { className: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1.5 text-[11.5px] text-fg-3">
      <span className={cn("size-3 rounded-[3px]", className)} aria-hidden />
      {children}
    </div>
  );
}
