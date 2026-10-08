import {
  CalendarCheck, Info, LayoutGrid, Tractor, UserRound, Wallet, type LucideIcon,
} from "lucide-react";
import { FAQ_CATEGORIAS } from "@/data/faq";
import { cn } from "@/lib/utils";
import type { FaqItem } from "@/types/catalogo";

/* Piezas que comparten la consulta de FAQ (/ayuda) y su gestión (/admin/faq). */

const CAT_ICON: Record<string, LucideIcon> = {
  "layout-grid": LayoutGrid, info: Info, "calendar-check": CalendarCheck,
  "user-round": UserRound, tractor: Tractor, wallet: Wallet,
};
export const CAT_BY_ID = Object.fromEntries(FAQ_CATEGORIAS.map((c) => [c.id, c]));

/** Etiqueta de una categoría por su id; una desconocida se muestra como "General". */
export const etiquetaCat = (catId: string): string => CAT_BY_ID[catId]?.label ?? "General";

/** Ícono de una categoría por su id; una desconocida cae en el de "General". */
export function CatIcono({ catId, className }: { catId: string; className?: string }) {
  const Icon = CAT_ICON[CAT_BY_ID[catId]?.icon ?? "info"] ?? Info;
  return <Icon className={className} />;
}

/** Cuántas entradas hay por categoría, más el total bajo `todas`. */
export function contarPorCategoria(items: FaqItem[]): Record<string, number> {
  const c: Record<string, number> = { todas: items.length };
  items.forEach((i) => { c[i.cat] = (c[i.cat] ?? 0) + 1; });
  return c;
}

/** Resalta la primera aparición de `term` dentro de `text`. */
export function resaltar(text: string, term: string): React.ReactNode {
  const t = term.trim();
  if (!t) return text;
  const idx = text.toLowerCase().indexOf(t.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="rounded-[3px] bg-green-100 px-0.5 text-green-900">{text.slice(idx, idx + t.length)}</mark>
      {text.slice(idx + t.length)}
    </>
  );
}

/** Chips de filtro por categoría, con su contador. */
export function FaqChips({ value, onChange, counts }: {
  value: string;
  onChange: (catId: string) => void;
  counts: Record<string, number>;
}) {
  return (
    <div role="tablist" aria-label="Filtrar por categoría" className="flex flex-wrap gap-2">
      {FAQ_CATEGORIAS.map((c) => {
        const on = value === c.id;
        return (
          <button
            key={c.id}
            type="button"
            role="tab"
            aria-selected={on}
            onClick={() => onChange(c.id)}
            className={cn(
              "inline-flex cursor-pointer items-center gap-2 rounded-pill border px-[13px] py-2 text-[13.5px] font-semibold whitespace-nowrap transition-colors",
              on
                ? "border-green-800 bg-green-800 text-white shadow-[inset_0_-2px_0_var(--green-900)]"
                : "border-sand bg-surface text-fg-2 hover:bg-cream-tert",
            )}
          >
            <CatIcono catId={c.id} className={cn("size-[15px]", on ? "text-white" : "text-fg-3")} />
            {c.label}
            <span
              className={cn(
                "inline-flex h-[19px] min-w-5 items-center justify-center rounded-[10px] px-1.5 font-mono text-[11.5px] font-bold",
                on ? "bg-white/20 text-white" : "bg-cream-tert text-fg-2",
              )}
            >
              {counts[c.id] ?? 0}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/**
 * Respuesta desplegable, justo debajo de la pregunta. La grilla 0fr → 1fr anima
 * la altura sin tener que medirla. `className` pone la sangría, que alinea el
 * texto con la pregunta y depende del tamaño de la fila.
 */
export function FaqDesplegable({ open, className, children }: {
  open: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "grid transition-[grid-template-rows,opacity] duration-200 ease-[cubic-bezier(.2,0,0,1)]",
        open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
      )}
    >
      <div className="overflow-hidden">
        <div className={className}>
          <div className="mb-3.5 h-px bg-outline-variant" />
          {children}
        </div>
      </div>
    </div>
  );
}
