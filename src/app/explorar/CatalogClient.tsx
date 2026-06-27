"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Sprout, MapPin, ChevronDown, ChevronLeft, ChevronRight, Check, X,
  RotateCcw, Star, Warehouse, ArrowRight, SearchX,
} from "lucide-react";
import Photo from "@/components/landing/Photo";
import { ACTIVIDADES, CULTIVO_OPTS, DEPTO_OPTS, type FilterOption } from "@/data/actividades";
import { moneyAr } from "@/lib/format";
import type { Actividad } from "@/types/catalogo";

const PAGE_SIZE = 10;

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

/* ---- Selector tipo input con popover ----------------------------------- */
function FilterSelect({
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
          <span
            onClick={(e) => { e.stopPropagation(); onChange(null); setOpen(false); }}
            style={{ display: "inline-flex", padding: 2, borderRadius: 6, lineHeight: 0 }}
          >
            <X size={16} color="var(--fg-3)" />
          </span>
        )}
        <ChevronDown size={16} color="var(--fg-3)" style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform .16s" }} />
      </button>

      {open && (
        <div
          style={{
            position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, zIndex: 50,
            background: "var(--surface)", border: "1px solid var(--outline-variant)", borderRadius: 12,
            boxShadow: "var(--shadow-pop)", padding: 6, maxHeight: 320, overflowY: "auto",
          }}
        >
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

/* ---- Chip de cultivo --------------------------------------------------- */
function CropChip({ children, active }: { children: React.ReactNode; active: boolean }) {
  return (
    <span
      style={{
        display: "inline-flex", alignItems: "center", gap: 5,
        background: active ? "var(--green-800)" : "var(--green-050)",
        color: active ? "#fff" : "var(--green-800)",
        borderRadius: "var(--radius-pill)", padding: "3px 10px", fontSize: 12, fontWeight: 600, lineHeight: 1.3,
      }}
    >
      <Sprout size={11} color={active ? "#fff" : "var(--green-700)"} /> {children}
    </span>
  );
}

/* ---- Tarjeta de actividad ---------------------------------------------- */
function CatalogCard({ act, cropFilter }: { act: Actividad; cropFilter: string | null }) {
  return (
    <Link href={`/explorar/${act.id}`} className="card-hover" style={{ textDecoration: "none", display: "flex", flexDirection: "column", background: "var(--surface)", border: "1px solid var(--outline-variant)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
      <div style={{ position: "relative" }}>
        <Photo seed={act.seed} height={180} radius={0} />
        <span
          style={{
            position: "absolute", top: 12, right: 12, display: "inline-flex", alignItems: "center", gap: 5,
            background: "rgba(251,249,248,.95)", borderRadius: "var(--radius-pill)", padding: "5px 11px", boxShadow: "0 2px 8px rgba(45,90,39,.16)",
          }}
        >
          <Star size={14} color="#C9A227" fill="#C9A227" />
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 13.5, fontWeight: 700, color: "var(--fg-1)" }}>{act.rating.toFixed(1)}</span>
          <span style={{ fontSize: 11.5, color: "var(--fg-3)" }}>({act.resenias})</span>
        </span>
        {act.tag && (
          <span style={{ position: "absolute", top: 12, left: 12, background: "var(--green-800)", color: "#fff", borderRadius: "var(--radius-pill)", padding: "4px 11px", fontSize: 11.5, fontWeight: 600 }}>{act.tag}</span>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", flex: 1, padding: 18, gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--fg-3)", fontSize: 13 }}>
          <MapPin size={14} color="var(--brown-700)" />
          <span style={{ fontWeight: 500, color: "var(--fg-2)" }}>{act.depto}, Mendoza</span>
        </div>
        <h3 style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18.5, color: "var(--fg-1)", lineHeight: 1.25 }}>{act.nombre}</h3>
        <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--fg-3)", fontSize: 13 }}>
          <Warehouse size={14} color="var(--fg-3)" />
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{act.finca}</span>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {act.cultivos.map((c) => <CropChip key={c} active={cropFilter === c}>{c}</CropChip>)}
        </div>
        <div style={{ marginTop: "auto", paddingTop: 14, borderTop: "1px solid var(--cream-tert)", display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 12 }}>
          <div style={{ minWidth: 0 }}>
            <div className="t-label" style={{ marginBottom: 2 }}>Desde</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 5 }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 19, fontWeight: 700, color: "var(--fg-1)" }}>{moneyAr(act.precioAdulto)}</span>
              <span style={{ fontSize: 12.5, color: "var(--fg-3)" }}>/ adulto</span>
            </div>
          </div>
          <span className="btn btn-primary btn-sm" style={{ flexShrink: 0, whiteSpace: "nowrap" }}>
            Ver detalle <ArrowRight size={16} />
          </span>
        </div>
      </div>
    </Link>
  );
}

/* ---- Paginación -------------------------------------------------------- */
function Pagination({ page, pages, onPage }: { page: number; pages: number; onPage: (n: number) => void }) {
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
      {Array.from({ length: pages }, (_, i) => i + 1).map((n) =>
        cell(n, { key: String(n), active: n === page, onClick: () => onPage(n), aria: `Página ${n}` }),
      )}
      {cell(<ChevronRight size={18} />, { key: "next", disabled: page === pages, onClick: () => onPage(page + 1), aria: "Página siguiente" })}
    </div>
  );
}

/* ---- Sin resultados ---------------------------------------------------- */
function EmptyResults({ onClear }: { onClear: () => void }) {
  return (
    <div style={{ textAlign: "center", padding: "64px 32px", background: "var(--surface)", border: "1px dashed var(--sand)", borderRadius: "var(--radius-lg)" }}>
      <div style={{ width: 68, height: 68, borderRadius: "50%", background: "var(--cream-tert)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px" }}>
        <SearchX size={30} color="var(--fg-3)" />
      </div>
      <h3 style={{ margin: "0 0 8px", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 21, color: "var(--fg-1)" }}>No encontramos experiencias</h3>
      <p style={{ margin: "0 auto 22px", color: "var(--fg-2)", fontSize: 15.5, maxWidth: 420, lineHeight: 1.5 }}>
        Ninguna actividad coincide con los filtros elegidos. Probá quitando alguno para ver más opciones.
      </p>
      <button type="button" className="btn btn-neutral" onClick={onClear}>
        <RotateCcw size={17} /> Limpiar filtros
      </button>
    </div>
  );
}

function ActiveFilterPill({ icon, label, onClear }: { icon: React.ReactNode; label: string; onClear: () => void }) {
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

/* ---- Catálogo ---------------------------------------------------------- */
export default function CatalogClient() {
  const [cultivo, setCultivo] = useState<string | null>(null);
  const [depto, setDepto] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const filtradas = useMemo(
    () => ACTIVIDADES.filter((a) => (!cultivo || a.cultivos.includes(cultivo)) && (!depto || a.depto === depto)),
    [cultivo, depto],
  );

  const pages = Math.max(1, Math.ceil(filtradas.length / PAGE_SIZE));
  const pageSafe = Math.min(page, pages);
  const visibles = filtradas.slice((pageSafe - 1) * PAGE_SIZE, pageSafe * PAGE_SIZE);

  useEffect(() => { setPage(1); }, [cultivo, depto]);

  const hasFilters = !!(cultivo || depto);
  const clearAll = () => { setCultivo(null); setDepto(null); };

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 28px 80px" }}>
      {/* Encabezado */}
      <div style={{ marginBottom: 24, maxWidth: 720 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--fg-3)", fontSize: 13, marginBottom: 10 }}>
          <Link href="/" style={{ color: "var(--fg-3)", textDecoration: "none" }}>Inicio</Link>
          <ChevronRight size={14} />
          <span style={{ color: "var(--fg-2)", fontWeight: 500 }}>Explorar actividades</span>
        </div>
        <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 38, color: "var(--fg-1)", margin: 0, letterSpacing: "-.015em", lineHeight: 1.1 }}>
          Descubrí <span style={{ color: "var(--green-800)" }}>experiencias</span> en toda la provincia
        </h1>
        <p style={{ color: "var(--fg-2)", fontSize: 16, lineHeight: 1.55, margin: "12px 0 0" }}>
          Cosechas, podas, recorridos y degustaciones en fincas de Mendoza. Filtrá por tipo de cultivo o por departamento para encontrar la tuya.
        </p>
      </div>

      {/* Barra de filtros */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--outline-variant)", borderRadius: "var(--radius-lg)", padding: 20, marginBottom: 22, display: "flex", alignItems: "flex-end", gap: 16, flexWrap: "wrap" }}>
        <FilterSelect icon={<Sprout size={18} />} label="Tipo de cultivo" allLabel="Todos los cultivos" value={cultivo} options={CULTIVO_OPTS} onChange={setCultivo} />
        <FilterSelect icon={<MapPin size={18} />} label="Departamento" allLabel="Todos los departamentos" value={depto} options={DEPTO_OPTS} onChange={setDepto} />
        {hasFilters && (
          <button type="button" onClick={clearAll} style={{ height: 46, display: "inline-flex", alignItems: "center", gap: 7, background: "transparent", border: "none", cursor: "pointer", color: "var(--green-800)", fontFamily: "var(--font-sans)", fontSize: 14.5, fontWeight: 600, padding: "0 6px" }}>
            <RotateCcw size={16} color="var(--green-800)" /> Limpiar filtros
          </button>
        )}
      </div>

      {/* Contador */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18, flexWrap: "wrap" }}>
        <span style={{ fontSize: 15, color: "var(--fg-2)" }}>
          <strong style={{ color: "var(--fg-1)", fontWeight: 700 }}>{filtradas.length}</strong>{" "}
          {filtradas.length === 1 ? "experiencia" : "experiencias"}
          {hasFilters ? " encontradas" : " disponibles"}
        </span>
        {cultivo && <ActiveFilterPill icon={<Sprout size={13} />} label={cultivo} onClear={() => setCultivo(null)} />}
        {depto && <ActiveFilterPill icon={<MapPin size={13} />} label={depto} onClear={() => setDepto(null)} />}
      </div>

      {/* Resultados */}
      {filtradas.length === 0 ? (
        <EmptyResults onClear={clearAll} />
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 24 }}>
            {visibles.map((act) => <CatalogCard key={act.id} act={act} cropFilter={cultivo} />)}
          </div>
          <Pagination page={pageSafe} pages={pages} onPage={setPage} />
        </>
      )}

      <style>{`
        .card-hover { transition: box-shadow .16s, border-color .16s, transform .16s; }
        .card-hover:hover { box-shadow: var(--shadow-hover); border-color: var(--sand); transform: translateY(-2px); }
      `}</style>
    </div>
  );
}
