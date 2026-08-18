"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, Check, X } from "lucide-react";
import type { FilterOption } from "@/types/catalogo";

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

function Option({ label, count, on, onClick }: { label: string; count?: number; on: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={(e) => { if (!on) e.currentTarget.style.background = "var(--cream-tert)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = on ? "var(--green-050)" : "transparent"; }}
      style={{
        width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "9px 11px",
        border: "none", borderRadius: 9, cursor: "pointer", fontFamily: "var(--font-sans)", fontSize: 14.5,
        textAlign: "left", marginBottom: 1, background: on ? "var(--green-050)" : "transparent",
      }}
    >
      <span style={{ flex: 1, fontWeight: on ? 600 : 500, color: on ? "var(--green-800)" : "var(--fg-1)" }}>{label}</span>
      {count !== undefined && <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--fg-3)" }}>{count}</span>}
      {on && <Check size={16} color="var(--green-800)" />}
    </button>
  );
}

/* ---- Selector tipo input con popover ----------------------------------- */
export function FilterSelect({
  icon, label, allLabel, value, options, onChange,
}: {
  icon: React.ReactNode; label: string; allLabel: string;
  value: string | null; options: FilterOption[]; onChange: (v: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useOutside(open, () => setOpen(false));
  const selected = options.find((o) => o.value === value) || null;

  return (
    <div ref={ref} style={{ position: "relative", flex: "1 1 240px", minWidth: 220 }}>
      <span className="t-label" style={{ display: "block", marginBottom: 7 }}>{label}</span>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          width: "100%", height: 46, display: "flex", alignItems: "center", gap: 10,
          padding: "0 14px", textAlign: "left", cursor: "pointer", fontFamily: "var(--font-sans)", fontSize: 15,
          background: "var(--surface)", borderRadius: "var(--radius)",
          border: `${open ? 2 : 1}px solid ${open ? "var(--green-800)" : "var(--sand)"}`,
          color: selected ? "var(--fg-1)" : "var(--fg-3)",
        }}
      >
        <span style={{ color: selected ? "var(--green-700)" : "var(--fg-3)", display: "inline-flex" }}>{icon}</span>
        <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: selected ? 600 : 500 }}>
          {selected ? selected.label : allLabel}
        </span>
        {selected && (
          <span onClick={(e) => { e.stopPropagation(); onChange(null); setOpen(false); }} style={{ display: "inline-flex", padding: 2, borderRadius: 6, lineHeight: 0 }}>
            <X size={16} color="var(--fg-3)" />
          </span>
        )}
        <ChevronDown size={16} color="var(--fg-3)" style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform .16s" }} />
      </button>

      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, zIndex: 50, background: "var(--surface)", border: "1px solid var(--outline-variant)", borderRadius: 12, boxShadow: "var(--shadow-pop)", padding: 6, maxHeight: 320, overflowY: "auto" }}>
          <Option label={allLabel} on={!selected} onClick={() => { onChange(null); setOpen(false); }} />
          <div style={{ height: 1, background: "var(--outline-variant)", margin: "4px 0" }} />
          {options.map((o) => (
            <Option key={o.value} label={o.label} count={o.count} on={o.value === value} onClick={() => { onChange(o.value); setOpen(false); }} />
          ))}
        </div>
      )}
    </div>
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
