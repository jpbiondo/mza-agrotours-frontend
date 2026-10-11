"use client";

import { useState } from "react";
import { ArrowRight, MessageSquareText } from "lucide-react";
import { Button, Estrellas } from "@/components/ui";
import { fmtPuntaje } from "@/lib/format";
import type { ActividadPublica } from "@/types/catalogo";
import ReseniaCard from "./ReseniaCard";
import ReseniasModal from "./ReseniasModal";

/**
 * Reseñas en el detalle: promedio, distribución y las más recientes, todo del
 * detalle de la actividad. "Ver todas" abre el modal con el listado completo.
 */
export default function Resenias({ a }: { a: ActividadPublica }) {
  const [abierto, setAbierto] = useState(false);
  const { promedio, total, distribucion } = a.resenias;

  if (total === 0) {
    return (
      <div className="flex items-start gap-3 rounded-lg border border-dashed border-sand bg-surface p-5">
        <MessageSquareText size={20} className="mt-px shrink-0 text-fg-3" aria-hidden />
        <div>
          <div className="text-[14.5px] font-semibold text-fg-1">Todavía no hay reseñas</div>
          <p className="mt-1 text-[13.5px] leading-normal text-fg-2">
            Las escriben los visitantes después de hacer la actividad.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="mb-[22px] grid grid-cols-1 items-center gap-7 sm:grid-cols-[240px_1fr]">
        <div className="rounded-xl bg-cream-tert p-4 text-center">
          <div className="font-display text-5xl leading-none font-bold text-fg-1">
            {promedio !== null ? fmtPuntaje(promedio) : "—"}
          </div>
          <Estrellas valor={promedio ?? 0} size={16} className="mt-1.5" />
          <div className="mt-1.5 text-[12.5px] text-fg-3">
            Sobre {total} {total === 1 ? "reseña" : "reseñas"}
          </div>
        </div>
        <div>
          {distribucion.map((d) => (
            <div key={d.puntaje} className="flex items-center gap-2.5 py-[3px]">
              <span className="w-7 font-mono text-xs text-fg-2">{d.puntaje}★</span>
              <span className="h-1.5 flex-1 overflow-hidden rounded-[3px] bg-cream-tert">
                <span className="block h-full bg-star" style={{ width: `${d.porcentaje}%` }} />
              </span>
              <span className="w-8 text-right font-mono text-[11.5px] text-fg-3">{d.porcentaje}%</span>
            </div>
          ))}
        </div>
      </div>

      {a.reseniasRecientes.length > 0 && (
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          {a.reseniasRecientes.map((r, i) => <ReseniaCard key={i} r={r} className="p-[18px]" />)}
        </div>
      )}

      <div className="mt-4 flex justify-center">
        <Button variant="neutral" size="sm" onClick={() => setAbierto(true)}>
          {total === 1 ? "Ver la reseña" : `Ver todas las ${total} reseñas`} <ArrowRight size={15} aria-hidden />
        </Button>
      </div>

      {abierto && <ReseniasModal a={a} onClose={() => setAbierto(false)} />}
    </>
  );
}
