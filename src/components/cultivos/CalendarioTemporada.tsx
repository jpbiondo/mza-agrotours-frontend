"use client";

import { Check } from "lucide-react";
import { useMesActual } from "@/hooks/useMesActual";
import { cn } from "@/lib/utils";
import type { EstadoMes, MesEstacionalidad } from "@/types/cultivos";

const ESTADOS: Record<EstadoMes, { label: string; celda: string; muestra: string }> = {
  cosecha: { label: "Cosecha", celda: "bg-green-800 text-white", muestra: "bg-green-800" },
  crecimiento: { label: "Crecimiento", celda: "bg-season-growing text-white", muestra: "bg-season-growing" },
  reposo: { label: "Reposo", celda: "bg-cream-tert text-fg-3", muestra: "bg-cream-tert border border-outline-variant" },
};

const ORDEN: EstadoMes[] = ["cosecha", "crecimiento", "reposo"];

/**
 * Barra de estacionalidad: los doce meses del año con lo que hace el cultivo en
 * cada uno. Marca el mes actual del visitante, que es sólo una ayuda visual: el
 * "en temporada" del listado lo decide el backend con su propio mes.
 *
 * Debajo de ~560px la barra scrollea en horizontal en vez de encogerse: con doce
 * columnas las etiquetas de los meses se vuelven ilegibles.
 */
export default function CalendarioTemporada({ calendario }: { calendario: MesEstacionalidad[] }) {
  const mesActual = useMesActual();

  return (
    <div>
      <div className="overflow-x-auto">
        <div className="mb-3 grid min-w-[520px] grid-cols-12 gap-1 p-1">
          {calendario.map((mes) => {
            const estado = ESTADOS[mes.estado];
            const esActual = mes.indice === mesActual;
            return (
              <div key={mes.indice} className="flex flex-col gap-1.5">
                <div
                  title={estado.label}
                  className={cn(
                    "flex h-11 items-center justify-center rounded-sm",
                    estado.celda,
                    esActual && "ring-2 ring-green-800 ring-offset-2 ring-offset-surface",
                  )}
                >
                  {mes.estado === "cosecha" && <Check size={14} aria-hidden />}
                  <span className="sr-only">
                    {mes.etiqueta}: {estado.label}
                    {esActual ? " (mes actual)" : ""}
                  </span>
                </div>
                <div
                  className={cn(
                    "text-center text-[11px] tracking-[.06em] uppercase",
                    esActual ? "font-bold text-green-800" : "font-medium text-fg-3",
                  )}
                >
                  {mes.etiqueta}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-[14px] flex flex-wrap gap-[18px] text-[12.5px] text-fg-2">
        {ORDEN.map((estado) => (
          <span key={estado} className="inline-flex items-center gap-[7px]">
            <span className={cn("h-3 w-3 rounded-[3px]", ESTADOS[estado].muestra)} aria-hidden />
            {ESTADOS[estado].label}
          </span>
        ))}
      </div>
    </div>
  );
}
