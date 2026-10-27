"use client";

import { useEffect, useId, useRef, useState } from "react";
import {
  ArrowDown, ArrowUp, ArrowUpDown, ChevronDown, ChevronLeft, ChevronRight, Check, RotateCcw, Search, SlidersHorizontal, X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { DireccionOrden, FilterOption } from "@/types/catalogo";

/* ---- Hook: cerrar popover al click fuera / Esc ------------------------- */
function useOutside(open: boolean, close: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) close(); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, [open, close]);
  return ref;
}

/* ---- Piezas compartidas por los dos selectores -------------------------- */

const ESTILO_MENU: React.CSSProperties = {
  position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, zIndex: 50,
  background: "var(--surface)", border: "1px solid var(--outline-variant)", borderRadius: 12,
  boxShadow: "var(--shadow-pop)", padding: 6, maxHeight: 330, overflowY: "auto",
};

/** Fila del popover. El hover sólo pinta la que no está elegida. */
function Fila({ on, onClick, role, style, children }: {
  on: boolean; onClick: () => void; role?: "option"; style?: React.CSSProperties; children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role={role}
      aria-selected={role === "option" ? on : undefined}
      onClick={onClick}
      onMouseEnter={(e) => { if (!on) e.currentTarget.style.background = "var(--cream-tert)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = on ? "var(--green-050)" : "transparent"; }}
      style={{
        width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "9px 11px",
        border: "none", borderRadius: 9, cursor: "pointer", fontFamily: "var(--font-sans)", fontSize: 14.5,
        textAlign: "left", marginBottom: 1, background: on ? "var(--green-050)" : "transparent",
        ...style,
      }}
    >
      {children}
    </button>
  );
}

/** Campo con label y popover: el disparador es igual en los dos selectores. */
function Campo({ label, icon, activo, open, texto, onToggle, onClose, extra, children }: {
  label: string; icon: React.ReactNode; activo: boolean; open: boolean; texto: string;
  onToggle: () => void; onClose: () => void; extra?: React.ReactNode; children: React.ReactNode;
}) {
  const ref = useOutside(open, onClose);

  return (
    <div ref={ref} style={{ position: "relative", flex: "1 1 240px", minWidth: 220 }}>
      <span className="t-label" style={{ display: "block", marginBottom: 7 }}>{label}</span>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={onToggle}
        style={{
          width: "100%", height: 46, display: "flex", alignItems: "center", gap: 10,
          padding: "0 14px", textAlign: "left", cursor: "pointer", fontFamily: "var(--font-sans)", fontSize: 15,
          background: "var(--surface)", borderRadius: "var(--radius)",
          border: `${open ? 2 : 1}px solid ${open ? "var(--green-800)" : "var(--sand)"}`,
          color: activo ? "var(--fg-1)" : "var(--fg-3)",
        }}
      >
        <span style={{ color: activo ? "var(--green-700)" : "var(--fg-3)", display: "inline-flex" }}>{icon}</span>
        <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: activo ? 600 : 500 }}>
          {texto}
        </span>
        {extra}
        <ChevronDown size={16} color="var(--fg-3)" style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform .16s" }} />
      </button>

      {open && children}
    </div>
  );
}

function Contador({ children }: { children: React.ReactNode }) {
  return <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--fg-3)" }}>{children}</span>;
}

/* ---- Campo de búsqueda --------------------------------------------------- */

/**
 * Búsqueda por texto de un catálogo. Mismas medidas que el disparador de los
 * selectores de arriba para que la fila de filtros quede pareja.
 *
 * Quien lo usa decide cuándo sale el pedido: `onChange` en cada tecla (con la
 * espera de `useBusquedaDiferida`) y `onSubmit` cuando el visitante aprieta
 * Enter y no quiere esperarla. Es un `<form>` para que Enter funcione solo.
 */
export function SearchField({
  label, placeholder, value, onChange, onSubmit, onClear,
}: {
  label: string; placeholder: string; value: string;
  onChange: (v: string) => void; onSubmit: () => void; onClear: () => void;
}) {
  const id = useId();

  return (
    <form
      role="search"
      className="w-full"
      onSubmit={(e) => { e.preventDefault(); onSubmit(); }}
    >
      <label htmlFor={id} className="t-label mb-[7px] block">{label}</label>
      <div className="group relative flex items-center">
        <Search className="pointer-events-none absolute left-3.5 size-[18px] text-fg-3 transition-colors group-focus-within:text-green-700" />
        <input
          id={id}
          type="text"
          value={value}
          placeholder={placeholder}
          autoComplete="off"
          onChange={(e) => onChange(e.target.value)}
          className="h-[46px] w-full rounded-md border border-sand bg-surface pr-11 pl-11 font-sans text-[15px] text-fg-1 placeholder:text-fg-3 focus:border-green-800 focus:ring-[3px] focus:ring-green-100 focus:outline-none"
        />
        {value !== "" && (
          <button
            type="button"
            onClick={onClear}
            aria-label="Limpiar búsqueda"
            className="absolute right-3 inline-flex cursor-pointer rounded-sm p-1 text-fg-3 hover:text-fg-2"
          >
            <X className="size-4" />
          </button>
        )}
      </div>
    </form>
  );
}

/* ---- Selector de un valor ----------------------------------------------- */
export function FilterSelect({
  icon, label, allLabel, value, options, onChange,
}: {
  icon: React.ReactNode; label: string; allLabel: string;
  value: string | null; options: FilterOption[]; onChange: (v: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value) || null;

  return (
    <Campo
      label={label}
      icon={icon}
      activo={!!selected}
      open={open}
      texto={selected ? selected.label : allLabel}
      onToggle={() => setOpen((o) => !o)}
      onClose={() => setOpen(false)}
      extra={selected && (
        <span onClick={(e) => { e.stopPropagation(); onChange(null); setOpen(false); }} style={{ display: "inline-flex", padding: 2, borderRadius: 6, lineHeight: 0 }}>
          <X size={16} color="var(--fg-3)" />
        </span>
      )}
    >
      <div role="listbox" style={ESTILO_MENU}>
        <Fila role="option" on={!selected} onClick={() => { onChange(null); setOpen(false); }}>
          <span style={{ flex: 1, fontWeight: !selected ? 600 : 500, color: !selected ? "var(--green-800)" : "var(--fg-1)" }}>{allLabel}</span>
          {!selected && <Check size={16} color="var(--green-800)" />}
        </Fila>
        <div style={{ height: 1, background: "var(--outline-variant)", margin: "4px 0" }} />
        {options.map((o) => {
          const on = o.value === value;
          return (
            <Fila key={o.value} role="option" on={on} onClick={() => { onChange(o.value); setOpen(false); }}>
              <span style={{ flex: 1, fontWeight: on ? 600 : 500, color: on ? "var(--green-800)" : "var(--fg-1)" }}>{o.label}</span>
              {o.count !== undefined && <Contador>{o.count}</Contador>}
              {on && <Check size={16} color="var(--green-800)" />}
            </Fila>
          );
        })}
      </div>
    </Campo>
  );
}

/* ---- Selector de varios valores ----------------------------------------- */

function CheckBox({ on }: { on: boolean }) {
  return (
    <span style={{
      width: 18, height: 18, flex: "0 0 18px", borderRadius: 5,
      border: on ? "none" : "1.5px solid var(--sand)",
      background: on ? "var(--green-800)" : "var(--surface)",
      display: "inline-flex", alignItems: "center", justifyContent: "center",
    }}>
      {on && <Check size={13} color="#fff" />}
    </span>
  );
}

/**
 * Varias opciones a la vez: el listado trae los que cumplan **alguna** de las
 * elegidas. `plural` es cómo se nombra el conjunto cuando hay más de uno
 * ("3 cultivos seleccionados").
 */
export function MultiFilterSelect({
  icon, label, allLabel, plural, values, options, onChange,
}: {
  icon: React.ReactNode; label: string; allLabel: string; plural: string;
  values: string[]; options: FilterOption[]; onChange: (v: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const n = values.length;
  const elegida = n === 1 ? options.find((o) => o.value === values[0]) : null;
  // Con una sola se muestra cuál; con varias, cuántas. El nombre de la única
  // elegida puede no estar todavía si las opciones siguen cargando.
  const texto = n === 0 ? allLabel : n === 1 ? (elegida?.label ?? "1 seleccionado") : `${n} ${plural} seleccionados`;
  const alternar = (v: string) => onChange(values.includes(v) ? values.filter((x) => x !== v) : [...values, v]);

  return (
    <Campo
      label={label}
      icon={icon}
      activo={n > 0}
      open={open}
      texto={texto}
      onToggle={() => setOpen((o) => !o)}
      onClose={() => setOpen(false)}
      extra={n > 1 && (
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 11.5, fontWeight: 700, color: "#fff", background: "var(--green-800)", borderRadius: "var(--radius-pill)", padding: "2px 7px", lineHeight: 1.4 }}>
          {n}
        </span>
      )}
    >
      <div role="listbox" aria-multiselectable="true" style={ESTILO_MENU}>
        {options.map((o) => {
          const on = values.includes(o.value);
          return (
            <Fila key={o.value} role="option" on={on} onClick={() => alternar(o.value)}>
              <CheckBox on={on} />
              <span style={{ flex: 1, fontWeight: on ? 600 : 500, color: on ? "var(--green-800)" : "var(--fg-1)" }}>{o.label}</span>
              {o.count !== undefined && <Contador>{o.count}</Contador>}
            </Fila>
          );
        })}
        {n > 0 && (
          <>
            <div style={{ height: 1, background: "var(--outline-variant)", margin: "5px 0" }} />
            <Fila on={false} onClick={() => onChange([])} style={{ justifyContent: "center", color: "var(--green-800)", fontWeight: 600 }}>
              <RotateCcw size={15} color="var(--green-800)" /> Limpiar selección
            </Fila>
          </>
        )}
      </div>
    </Campo>
  );
}

/* ---- Paginación -------------------------------------------------------- */
export function Pagination({ page, pages, onPage }: { page: number; pages: number; onPage: (n: number) => void }) {
  if (pages <= 1) return null;
  const cell = (content: React.ReactNode, opts: { key: string; active?: boolean; disabled?: boolean; onClick: () => void; aria: string }) => (
    <button
      key={opts.key}
      onClick={opts.onClick}
      disabled={opts.disabled}
      aria-label={opts.aria}
      style={{
        minWidth: 40, height: 40, padding: "0 11px", borderRadius: "var(--radius)",
        border: `1px solid ${opts.active ? "var(--green-800)" : "var(--sand)"}`,
        background: opts.active ? "var(--green-800)" : "var(--surface)",
        color: opts.active ? "#fff" : opts.disabled ? "var(--fg-3)" : "var(--fg-1)",
        fontFamily: "var(--font-sans)", fontSize: 14.5, fontWeight: 600,
        cursor: opts.disabled ? "not-allowed" : "pointer",
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        opacity: opts.disabled ? 0.5 : 1, boxShadow: opts.active ? "inset 0 -2px 0 var(--green-900)" : "none",
      }}
    >
      {content}
    </button>
  );
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 40 }}>
      {cell(<ChevronLeft size={18} />, { key: "prev", disabled: page === 1, onClick: () => onPage(page - 1), aria: "Página anterior" })}
      {Array.from({ length: pages }, (_, i) => i + 1).map((n) => cell(n, { key: String(n), active: n === page, onClick: () => onPage(n), aria: `Página ${n}` }))}
      {cell(<ChevronRight size={18} />, { key: "next", disabled: page === pages, onClick: () => onPage(page + 1), aria: "Página siguiente" })}
    </div>
  );
}

/* ---- Grupo de chips de un valor ----------------------------------------- */

/**
 * Opciones a la vista, para cuando son pocas (rangos de precio, puntuación).
 * Una sola a la vez: tocar la elegida la suelta. `value` es la clave de la
 * opción elegida; quien lo usa decide cómo se arma.
 */
export function ChipGroup({
  icon, label, value, options, onChange,
}: {
  icon: React.ReactNode; label: string; value: string | null;
  options: FilterOption[]; onChange: (v: string | null) => void;
}) {
  const id = useId();
  return (
    <div role="group" aria-labelledby={id} className="flex min-w-0 flex-col gap-2">
      <span id={id} className="t-label flex items-center gap-1.5 [&_svg]:size-3.5 [&_svg]:text-fg-3">
        {icon}{label}
      </span>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => {
          const on = o.value === value;
          return (
            <button
              key={o.value}
              type="button"
              aria-pressed={on}
              onClick={() => onChange(on ? null : o.value)}
              className={cn(
                "inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-pill border px-3.5 font-sans text-sm whitespace-nowrap transition-colors",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-800",
                on
                  ? "border-green-800 bg-green-800 font-semibold text-white"
                  : "border-sand bg-surface font-medium text-fg-1 hover:bg-cream-tert",
              )}
            >
              {on && <Check className="size-3.5" />}
              {o.label}
              {o.count !== undefined && (
                <span className={cn("font-mono text-[11.5px]", on ? "text-white/80" : "text-fg-3")}>{o.count}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ---- Botón "Más filtros" ------------------------------------------------ */

/** Abre y cierra el panel de filtros secundarios; `count` dice cuántos hay puestos. */
export function MoreFiltersButton({ open, count, controls, onClick }: {
  open: boolean; count: number; controls: string; onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={open}
      aria-controls={controls}
      className={cn(
        "inline-flex h-[46px] shrink-0 cursor-pointer items-center gap-2 rounded-md border px-3.5 font-sans text-[14.5px] font-semibold whitespace-nowrap text-fg-1",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-800",
        open ? "bg-green-050" : "bg-surface hover:bg-cream-tert",
        open || count > 0 ? "border-green-300" : "border-sand",
      )}
    >
      <SlidersHorizontal className="size-[17px] text-green-800" />
      Más filtros
      {count > 0 && (
        <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-pill bg-green-800 px-1.5 text-xs font-bold text-white">
          {count}
        </span>
      )}
      <ChevronDown className={cn("size-[15px] text-fg-3 transition-transform", open && "rotate-180")} />
    </button>
  );
}

/* ---- Orden por columna ------------------------------------------------- */

export interface CriterioOrden {
  key: string;
  label: string;
  icon: React.ReactNode;
  /** Con qué dirección arranca al tocarlo: el precio de menor a mayor, la puntuación de mayor a menor. */
  primera: DireccionOrden;
  value: DireccionOrden | null;
  onChange: (v: DireccionOrden | null) => void;
}

/**
 * Un botón por criterio, que gira sin orden → primera dirección → la otra →
 * sin orden. Se pueden combinar: el orden de `criterios` es la prioridad, y
 * con más de uno puesto cada botón muestra su número.
 */
export function SortToggles({ criterios }: { criterios: CriterioOrden[] }) {
  const activos = criterios.filter((c) => c.value !== null);
  const siguiente = (c: CriterioOrden): DireccionOrden | null =>
    c.value === null ? c.primera : c.value === c.primera ? (c.primera === "asc" ? "desc" : "asc") : null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-fg-3">Ordenar por</span>
      {criterios.map((c) => {
        const on = c.value !== null;
        const estado = c.value === "asc" ? "de menor a mayor" : c.value === "desc" ? "de mayor a menor" : "sin ordenar";
        const Flecha = c.value === "asc" ? ArrowUp : c.value === "desc" ? ArrowDown : ArrowUpDown;
        return (
          <button
            key={c.key}
            type="button"
            aria-pressed={on}
            aria-label={`${c.label}: ${estado}`}
            title={estado.charAt(0).toUpperCase() + estado.slice(1)}
            onClick={() => c.onChange(siguiente(c))}
            className={cn(
              "inline-flex h-9 shrink-0 cursor-pointer items-center gap-[7px] rounded-pill border px-3 font-sans text-sm font-semibold whitespace-nowrap transition-colors",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-800",
              on ? "border-green-300 bg-green-050 text-green-800" : "border-sand bg-surface text-fg-2 hover:bg-cream-tert",
            )}
          >
            <span className={cn("inline-flex [&_svg]:size-[15px]", on ? "text-green-700" : "text-fg-3")}>{c.icon}</span>
            {c.label}
            {on && activos.length > 1 && (
              <span className="font-mono text-[11px] text-green-700">{activos.indexOf(c) + 1}</span>
            )}
            <Flecha className={cn("size-[15px]", on ? "text-green-800" : "text-fg-3")} />
          </button>
        );
      })}
    </div>
  );
}

/* ---- Pill de filtro activo --------------------------------------------- */
export function ActiveFilterPill({ icon, label, onClear }: { icon: React.ReactNode; label: string; onClear: () => void }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "var(--green-050)", border: "1px solid var(--green-300)", borderRadius: "var(--radius-pill)", padding: "5px 8px 5px 11px", fontSize: 13, fontWeight: 600, color: "var(--green-800)" }}>
      <span style={{ display: "inline-flex", color: "var(--green-700)" }}>{icon}</span>
      {label}
      <button type="button" onClick={onClear} aria-label={`Quitar ${label}`} style={{ display: "inline-flex", border: "none", background: "transparent", cursor: "pointer", padding: 1, lineHeight: 0 }}>
        <X size={14} color="var(--green-700)" />
      </button>
    </span>
  );
}

/* ---- Chip de cultivo --------------------------------------------------- */
export function CropChip({ children, active }: { children: React.ReactNode; active: boolean }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: active ? "var(--green-800)" : "var(--green-050)", color: active ? "#fff" : "var(--green-800)", borderRadius: "var(--radius-pill)", padding: "3px 10px", fontSize: 12, fontWeight: 600, lineHeight: 1.3 }}>
      <SproutMini active={active} /> {children}
    </span>
  );
}

function SproutMini({ active }: { active: boolean }) {
  // pequeño ícono inline para evitar otra import en cada card
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={active ? "#fff" : "var(--green-700)"} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 20h10" /><path d="M10 20c5.5-2.5.8-6.4 3-10" /><path d="M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3-1.2-.6-2.3-1.9-3-4.2 2.8-.5 4.4 0 5.5.8" /><path d="M14.1 6a7 7 0 0 0-1.1 4c1.9-.1 3.3-.6 4.3-1.4 1-1 1.6-2.3 1.7-4.6-2.7.1-4 1-4.9 2" />
    </svg>
  );
}
