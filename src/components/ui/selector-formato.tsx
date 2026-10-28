"use client";
import type { LucideIcon } from "lucide-react";
import { FileSpreadsheet, FileText, Table2 } from "lucide-react";
import type { FormatoExport } from "@/lib/exportar";
import { cn } from "@/lib/utils";

const FORMATOS: { id: FormatoExport; label: string; sub: string; Icon: LucideIcon }[] = [
  { id: "pdf", label: "PDF", sub: "Con formato, listo para imprimir", Icon: FileText },
  { id: "csv", label: "CSV", sub: "Datos tabulares, separado por comas", Icon: FileSpreadsheet },
  { id: "xlsx", label: "Excel", sub: "Hoja de cálculo .xlsx", Icon: Table2 },
];

/**
 * Los tres formatos de descarga en recuadros elegibles, con radios nativos: el
 * teclado y el lector de pantalla salen solos. Lo comparten las exportaciones
 * (estadísticas, planilla del día).
 */
export function SelectorFormato({ value, onChange, name = "formato" }: {
  value: FormatoExport;
  onChange: (f: FormatoExport) => void;
  name?: string;
}) {
  return (
    <div role="radiogroup" aria-label="Formato" className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-3">
      {FORMATOS.map(({ id, label, sub, Icon }) => {
        const on = value === id;
        return (
          <label
            key={id}
            className={cn(
              "flex cursor-pointer flex-col items-start gap-1.5 rounded-md border px-3 py-3.5 transition-colors has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/50",
              on ? "border-green-800 bg-green-050" : "border-outline-variant bg-surface hover:border-sand",
            )}
          >
            <input type="radio" name={name} value={id} checked={on} onChange={() => onChange(id)} className="sr-only" />
            <Icon size={20} className={on ? "text-green-800" : "text-fg-2"} />
            <span className="text-sm font-semibold text-fg-1">{label}</span>
            <span className="text-[11.5px] leading-[1.3] text-fg-3">{sub}</span>
          </label>
        );
      })}
    </div>
  );
}
