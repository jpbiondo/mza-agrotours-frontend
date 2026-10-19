"use client";

import { ChevronLeft, ChevronRight, Lock, Plus } from "lucide-react";
import { IconButton, Skeleton } from "@/components/ui";
import { MESES_LABEL, NOMBRES_DIA } from "@/data/calendario";
import { cn } from "@/lib/utils";
import type { DiaProgramado, FechaISO } from "@/types/gestion-dias";

export type Celda =
  | {
      tipo: "programado";
      dia: number;
      ref: DiaProgramado;
      hoy: boolean;
      /** Si responde al click; qué hace lo decide la pantalla. */
      clickeable: boolean;
      seleccionado?: boolean;
      titulo?: string;
    }
  | { tipo: "finalizado"; dia: number; pagadas: number; cupoMax: number }
  | { tipo: "abrible"; dia: number; fecha: FechaISO }
  | { tipo: "off"; dia: number; titulo: string };

const BASE = "relative flex w-full flex-col justify-between rounded-[10px] p-[8px_7px_9px] text-left transition-[background-color,border-color,box-shadow,transform]";

function Dia({ celda, onElegir, alto }: { celda: Celda; onElegir: (c: Celda) => void; alto: string }) {
  if (celda.tipo === "off") {
    return (
      <div title={celda.titulo} className={cn(BASE, alto, "items-center justify-start text-sm text-fg-3 opacity-50")}>
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
          alto,
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
        className={cn(BASE, alto, "cursor-not-allowed border border-outline-variant bg-cream-tert")}
      >
        <div className="flex items-center justify-between gap-1">
          <span className="text-[15px] leading-none font-semibold text-fg-3">{celda.dia}</span>
          <Lock className="size-3 text-fg-3" />
        </div>
        <div className="font-mono text-[11px] text-fg-3">{celda.pagadas}/{celda.cupoMax}</div>
      </div>
    );
  }

  const { dia, ref, hoy, clickeable, seleccionado, titulo } = celda;
  const { pagadas, pendientes, cupoMax } = ref;

  return (
    <button
      type="button"
      disabled={!clickeable}
      onClick={() => onElegir(celda)}
      title={clickeable ? titulo : undefined}
      aria-pressed={seleccionado}
      aria-label={`${dia}: ${pagadas} pagadas, ${pendientes} en espera de pago, cupo ${cupoMax}`}
      className={cn(
        BASE,
        alto,
        seleccionado
          ? "border border-green-800 bg-green-800 text-fg-on-dark shadow-[inset_0_-2px_0_var(--green-900)]"
          : "border border-green-300 bg-green-050 text-fg-1",
        hoy && !seleccionado && "shadow-[inset_0_0_0_1px_var(--green-800)]",
        clickeable && !seleccionado && "cursor-pointer hover:border-green-700 hover:shadow-hover active:translate-y-px",
        !clickeable && "cursor-default",
      )}
    >
      <div className="flex items-center justify-between gap-1">
        <span className={cn("text-[15px] leading-none", seleccionado ? "font-bold" : "font-semibold")}>{dia}</span>
        {hoy && (
          <span className={cn("text-[9px] font-bold tracking-[.06em] uppercase", seleccionado ? "text-fg-on-dark" : "text-green-800")}>
            Hoy
          </span>
        )}
      </div>
      <div className="w-full">
        <div className={cn("mb-1 font-mono text-[11px] tracking-[.01em]", seleccionado ? "text-white/80" : "text-fg-2")}>
          {pagadas}/{cupoMax}
        </div>
        <BarraCupos
          pagadas={pagadas}
          pendientes={pendientes}
          cupoMax={cupoMax}
          className={cn("h-1", seleccionado && "bg-white/30")}
          invertida={seleccionado}
        />
      </div>
    </button>
  );
}

/**
 * Ocupación de un día: pagadas en verde y en espera en naranja, sobre el cupo.
 * `invertida` es para pintarla sobre verde oscuro (el día seleccionado).
 */
export function BarraCupos({
  pagadas, pendientes, cupoMax, className, invertida,
}: { pagadas: number; pendientes: number; cupoMax: number; className?: string; invertida?: boolean }) {
  const pPag = cupoMax > 0 ? Math.min(100, (pagadas / cupoMax) * 100) : 0;
  const pPen = cupoMax > 0 ? Math.min(100 - pPag, (pendientes / cupoMax) * 100) : 0;
  return (
    <div className={cn("flex w-full overflow-hidden rounded-pill bg-cream-tert", className)}>
      {/* Los anchos salen de los datos: no hay utilidad de Tailwind que los cubra. */}
      <div className={cn("h-full transition-[width]", invertida ? "bg-white" : "bg-green-700")} style={{ width: `${pPag}%` }} />
      <div className={cn("h-full transition-[width]", invertida ? "bg-white/50" : "bg-warning")} style={{ width: `${pPen}%` }} />
    </div>
  );
}

export type ItemLeyenda = { muestra: string; label: string };

/** Leyenda de la gestión de días; la vista de consulta pasa la suya. */
export const LEYENDA_GESTION: ItemLeyenda[] = [
  { muestra: "border border-green-300 bg-green-050", label: "Programado" },
  { muestra: "bg-green-700", label: "Cupos pagados" },
  { muestra: "bg-warning", label: "En espera de pago" },
  { muestra: "border border-dashed border-outline-variant", label: "Libre — tocá para abrir" },
  { muestra: "border border-outline-variant bg-cream-tert", label: "Finalizado" },
];

/**
 * Alto mínimo de la celda, como el `cellMin` del diseño: compacta (62px) en la
 * consulta, donde el calendario comparte la fila con el panel del día; amplia
 * en la gestión de días, que ocupa todo el ancho. En pantallas angostas la
 * amplia también se compacta para que la celda no quede más alta que ancha.
 */
const ALTO_CELDA = {
  compacta: "min-h-[62px]",
  amplia: "min-h-[62px] md:min-h-24",
} as const;

/**
 * Grilla mensual (semana desde el lunes). Cada pantalla arma sus celdas y
 * decide qué hace el click; mientras `cargando`, la grilla se reemplaza por un
 * esqueleto del mismo tamaño para que la navegación entre meses no salte.
 */
export function CalendarioMensual({
  anio, mes0, celdas, cargando, onElegir, onPrev, onNext, puedePrev, puedeNext, leyenda = LEYENDA_GESTION, alturaCelda = "compacta",
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
  leyenda?: ItemLeyenda[];
  alturaCelda?: keyof typeof ALTO_CELDA;
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
        <IconButton onClick={onPrev} disabled={!puedePrev} aria-label="Mes anterior">
          <ChevronLeft />
        </IconButton>
        <div className="font-display text-lg font-bold text-fg-1" aria-live="polite">
          {MESES_LABEL[mes0]} {anio}
        </div>
        <IconButton onClick={onNext} disabled={!puedeNext} aria-label="Mes siguiente">
          <ChevronRight />
        </IconButton>
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
            <Skeleton key={i} className={cn("rounded-[10px]", ALTO_CELDA[alturaCelda])} />
          ) : (
            <Dia key={i} celda={c} onElegir={onElegir} alto={ALTO_CELDA[alturaCelda]} />
          ),
        )}
      </div>

      <div className="mt-[18px] flex flex-wrap gap-4 border-t border-outline-variant pt-4">
        {leyenda.map((l) => (
          <div key={l.label} className="flex items-center gap-[7px] text-xs text-fg-2">
            <span className={cn("size-3.5 rounded-[4px]", l.muestra)} />
            {l.label}
          </div>
        ))}
      </div>
    </div>
  );
}
