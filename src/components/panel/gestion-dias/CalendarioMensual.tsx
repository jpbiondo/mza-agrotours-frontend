"use client";

import { ChevronLeft, ChevronRight, Lock, Plus } from "lucide-react";
import { Skeleton } from "@/components/ui";
import { MESES_LABEL, NOMBRES_DIA } from "@/data/calendario";
import { cn } from "@/lib/utils";
import type { DiaProgramado, FechaISO } from "@/types/gestion-dias";

export type Celda =
  | { tipo: "programado"; dia: number; ref: DiaProgramado; hoy: boolean; editable: boolean }
  | { tipo: "finalizado"; dia: number; pagadas: number; cupoMax: number }
  | { tipo: "abrible"; dia: number; fecha: FechaISO }
  | { tipo: "off"; dia: number; titulo: string };

const BASE = "relative flex min-h-24 w-full flex-col justify-between rounded-[10px] p-[8px_7px_9px] text-left transition-[background-color,border-color,box-shadow,transform]";

function Dia({ celda, onElegir }: { celda: Celda; onElegir: (c: Celda) => void }) {
  if (celda.tipo === "off") {
    return (
      <div title={celda.titulo} className={cn(BASE, "items-center justify-start text-sm text-fg-3 opacity-50")}>
        {celda.dia}
      </div>
    );
  }

  if (celda.tipo === "abrible") {
    return (
      <button
        type="button"
        onClick={() => onElegir(celda)}
        title="Abrir este día a reservas"
        aria-label={`${celda.dia}: abrir día`}
        className={cn(
          BASE,
          "group cursor-pointer border border-dashed border-outline-variant bg-transparent",
          "hover:border-solid hover:border-green-300 hover:bg-green-050",
        )}
      >
        <span className="text-[15px] leading-none font-semibold text-fg-3 group-hover:text-fg-1">{celda.dia}</span>
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-green-800 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
          <Plus className="size-[13px]" /> Abrir
        </span>
      </button>
    );
  }

  if (celda.tipo === "finalizado") {
    return (
      <div
        title="Día finalizado: no se puede modificar"
        aria-disabled="true"
        className={cn(BASE, "cursor-not-allowed border border-outline-variant bg-cream-tert")}
      >
        <div className="flex items-center justify-between gap-1">
          <span className="text-[15px] leading-none font-semibold text-fg-3">{celda.dia}</span>
          <Lock className="size-3 text-fg-3" />
        </div>
        <div className="font-mono text-[11px] text-fg-3">{celda.pagadas}/{celda.cupoMax}</div>
      </div>
    );
  }

  const { dia, ref, hoy, editable } = celda;
  const { pagadas, pendientes, cupoMax } = ref;

  return (
    <button
      type="button"
      disabled={!editable}
      onClick={() => onElegir(celda)}
      title={editable ? "Modificar el cupo de este día" : undefined}
      aria-label={`${dia}: ${pagadas} pagadas, ${pendientes} en espera de pago, cupo ${cupoMax}`}
      className={cn(
        BASE,
        "border border-green-300 bg-green-050 text-fg-1",
        hoy && "shadow-[inset_0_0_0_1px_var(--green-800)]",
        editable ? "cursor-pointer hover:border-green-700 hover:shadow-hover active:translate-y-px" : "cursor-default",
      )}
    >
      <div className="flex items-center justify-between gap-1">
        <span className="text-[15px] leading-none font-semibold">{dia}</span>
        {hoy && <span className="text-[9px] font-bold tracking-[.06em] text-green-800 uppercase">Hoy</span>}
      </div>
      <div className="w-full">
        <div className="mb-1 font-mono text-[11px] tracking-[.01em] text-fg-2">{pagadas}/{cupoMax}</div>
        <BarraCupos pagadas={pagadas} pendientes={pendientes} cupoMax={cupoMax} className="h-1" />
      </div>
    </button>
  );
}

/** Ocupación de un día: pagadas en verde y en espera en naranja, sobre el cupo. */
export function BarraCupos({
  pagadas, pendientes, cupoMax, className,
}: { pagadas: number; pendientes: number; cupoMax: number; className?: string }) {
  const pPag = cupoMax > 0 ? Math.min(100, (pagadas / cupoMax) * 100) : 0;
  const pPen = cupoMax > 0 ? Math.min(100 - pPag, (pendientes / cupoMax) * 100) : 0;
  return (
    <div className={cn("flex w-full overflow-hidden rounded-pill bg-cream-tert", className)}>
      {/* Los anchos salen de los datos: no hay utilidad de Tailwind que los cubra. */}
      <div className="h-full bg-green-700 transition-[width]" style={{ width: `${pPag}%` }} />
      <div className="h-full bg-warning transition-[width]" style={{ width: `${pPen}%` }} />
    </div>
  );
}

const LEYENDA = [
  { muestra: "border border-green-300 bg-green-050", label: "Programado" },
  { muestra: "bg-green-700", label: "Cupos pagados" },
  { muestra: "bg-warning", label: "En espera de pago" },
  { muestra: "border border-dashed border-outline-variant", label: "Libre — tocá para abrir" },
  { muestra: "border border-outline-variant bg-cream-tert", label: "Finalizado" },
];

const NAV =
  "flex size-9 items-center justify-center rounded-md border border-outline-variant bg-surface text-fg-1 shadow-[inset_0_-2px_0_var(--outline-variant)] transition-colors hover:bg-cream-tert disabled:cursor-not-allowed disabled:border-cream-tert disabled:bg-cream-tert disabled:text-fg-3 disabled:shadow-none";

/**
 * Grilla mensual (semana desde el lunes). Cada pantalla arma sus celdas y
 * decide qué hace el click; mientras `cargando`, la grilla se reemplaza por un
 * esqueleto del mismo tamaño para que la navegación entre meses no salte.
 */
export function CalendarioMensual({
  anio, mes0, celdas, cargando, onElegir, onPrev, onNext, puedePrev, puedeNext,
}: {
  anio: number;
  mes0: number;
  celdas: Celda[];
  cargando: boolean;
  onElegir: (c: Celda) => void;
  onPrev: () => void;
  onNext: () => void;
  puedePrev: boolean;
  puedeNext: boolean;
}) {
  const huecos = (new Date(anio, mes0, 1).getDay() + 6) % 7;
  // Cargando, los días del mes nuevo se dibujan en esqueleto aunque no haya celdas.
  const dias: Celda[] = cargando
    ? Array.from({ length: new Date(anio, mes0 + 1, 0).getDate() }, (_, i) => ({ tipo: "off", dia: i + 1, titulo: "" }))
    : celdas;
  const grilla: (Celda | null)[] = [...Array<null>(huecos).fill(null), ...dias];
  while (grilla.length % 7 !== 0) grilla.push(null);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <button type="button" onClick={onPrev} disabled={!puedePrev} aria-label="Mes anterior" className={NAV}>
          <ChevronLeft className="size-[17px]" />
        </button>
        <div className="font-display text-lg font-bold text-fg-1" aria-live="polite">
          {MESES_LABEL[mes0]} {anio}
        </div>
        <button type="button" onClick={onNext} disabled={!puedeNext} aria-label="Mes siguiente" className={NAV}>
          <ChevronRight className="size-[17px]" />
        </button>
      </div>

      <div className="mb-2 grid grid-cols-7 gap-1.5">
        {NOMBRES_DIA.map((n) => (
          <div key={n} className="py-0.5 text-center text-[11px] font-bold tracking-[.06em] text-fg-3 uppercase">
            {n}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1.5" aria-busy={cargando}>
        {grilla.map((c, i) =>
          c === null ? (
            <div key={i} />
          ) : cargando ? (
            <Skeleton key={i} className="min-h-24 rounded-[10px]" />
          ) : (
            <Dia key={i} celda={c} onElegir={onElegir} />
          ),
        )}
      </div>

      <div className="mt-[18px] flex flex-wrap gap-4 border-t border-outline-variant pt-4">
        {LEYENDA.map((l) => (
          <div key={l.label} className="flex items-center gap-[7px] text-xs text-fg-2">
            <span className={cn("size-3.5 rounded-[4px]", l.muestra)} />
            {l.label}
          </div>
        ))}
      </div>
    </div>
  );
}
