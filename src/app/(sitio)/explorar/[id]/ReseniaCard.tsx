"use client";

import { Estrellas, TextoExpandible } from "@/components/ui";
import { fmtDiaLargo, recortar } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Resenia } from "@/types/catalogo";

/** Caracteres de la reseña en las tarjetas del detalle de la actividad. */
const MAX_RESUMEN = 220;
/** Caracteres antes del "Ver más" en el listado completo. */
const MAX_LISTADO = 400;

/**
 * Nombre del autor con el apellido abreviado ("Federico Gómez" → "Federico G."):
 * la reseña es pública y el nombre completo del visitante no hace falta.
 */
export function autorCorto(nombre: string): string {
  const partes = nombre.split(/\s+/).filter(Boolean);
  if (partes.length === 0) return "Visitante";
  if (partes.length === 1) return partes[0];
  return `${partes[0]} ${partes[partes.length - 1][0].toUpperCase()}.`;
}

function inicialesAutor(nombre: string): string {
  const partes = nombre.split(/\s+/).filter(Boolean);
  if (partes.length === 0) return "V";
  return (partes[0][0] + (partes.length > 1 ? partes[partes.length - 1][0] : "")).toUpperCase();
}

/**
 * Una reseña: autor, fecha, estrellas y el texto si lo escribió. El texto
 * puede llegar a 2000 caracteres, así que se recorta: en el resumen del
 * detalle sólo con "…"; con `expandible` (el listado completo) además con un
 * "Ver más" que la despliega entera.
 */
export default function ReseniaCard({ r, expandible = false, className }: {
  r: Resenia;
  expandible?: boolean;
  className?: string;
}) {
  return (
    <article className={cn("rounded-xl border border-outline-variant bg-surface p-4", className)}>
      <div className={cn("flex items-center gap-2.5", r.texto && "mb-2")}>
        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-green-700 text-[13px] font-semibold text-white">
          {inicialesAutor(r.autor)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[13.5px] font-semibold text-fg-1">{autorCorto(r.autor)}</div>
          {r.fecha && <div className="text-[11.5px] text-fg-3">{fmtDiaLargo(r.fecha)}</div>}
        </div>
        <Estrellas valor={r.puntaje} size={13} className="shrink-0" />
      </div>
      {r.texto && (expandible
        ? <TextoExpandible texto={r.texto} max={MAX_LISTADO} className="text-[13.5px] leading-normal" />
        : <p className="text-[13.5px] leading-normal wrap-break-word whitespace-pre-line text-fg-2">{recortar(r.texto, MAX_RESUMEN)}</p>
      )}
    </article>
  );
}
