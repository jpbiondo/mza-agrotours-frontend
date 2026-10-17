"use client";

import { useState } from "react";
import { Estrellas } from "@/components/ui";
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
  const [completa, setCompleta] = useState(false);
  const max = expandible ? MAX_LISTADO : MAX_RESUMEN;
  const largo = !!r.texto && r.texto.length > max;
  const texto = r.texto && (largo && !completa ? recortar(r.texto, max) : r.texto);

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
      {texto && (
        <p className="text-[13.5px] leading-normal wrap-break-word whitespace-pre-line text-fg-2">{texto}</p>
      )}
      {expandible && largo && (
        <button
          type="button"
          onClick={() => setCompleta((c) => !c)}
          aria-expanded={completa}
          className="mt-1.5 cursor-pointer text-[13px] font-semibold text-green-800 underline-offset-2 hover:underline"
        >
          {completa ? "Ver menos" : "Ver más"}
        </button>
      )}
    </article>
  );
}
