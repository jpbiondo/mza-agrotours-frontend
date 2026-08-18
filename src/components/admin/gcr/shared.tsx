"use client";

import { useEffect } from "react";
import { Search, SearchX, Trash2, X, Plus, Check, AlertCircle, ChevronRight, Gauge } from "lucide-react";
import { GCR_MESES, GCR_ESTACIONES, GCR_EST_ORDEN, gcrCultivoNombre, gcrCultivoColor } from "@/data/gestionCr";
import type { Dificultad, Estacion, GcrCultivo } from "@/types/gestionCr";

export const inputBase: React.CSSProperties = { width: "100%", fontFamily: "var(--font-sans)", fontSize: 15.5, color: "var(--fg-1)", borderRadius: "var(--radius)", border: "1px solid var(--sand)", padding: "12px 14px", outline: "none", boxSizing: "border-box", background: "var(--surface)" };

/* ---- Escape-to-close hook ---------------------------------------------- */
function useEscape(onClose: () => void) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
}

/* ---- Flash toast ------------------------------------------------------- */
export function GcrFlash({ flash }: { flash: string | null }) {
  if (!flash) return null;
  return (
    <div className="pop" style={{ position: "fixed", right: 24, bottom: 24, zIndex: 90, maxWidth: 420, background: "var(--green-800)", color: "#fff", borderRadius: "var(--radius)", padding: "14px 20px", display: "flex", alignItems: "center", gap: 10, boxShadow: "var(--shadow-pop)", fontSize: 15, fontWeight: 500 }}>
      <Check size={20} color="#fff" /> {flash}
    </div>
  );
}

/* ---- Confirmación de eliminación --------------------------------------- */
export function GcrConfirmDelete({ open, title, body, busy, onCancel, onConfirm }: { open: boolean; title: string; body: React.ReactNode; busy?: boolean; onCancel: () => void; onConfirm: () => void }) {
  useEscape(onCancel);
  if (!open) return null;
  return (
    <div onMouseDown={(e) => { if (e.target === e.currentTarget) onCancel(); }} style={{ position: "fixed", inset: 0, zIndex: 80, background: "rgba(42,38,32,.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, backdropFilter: "blur(2px)" }}>
      <div className="pop" style={{ background: "var(--surface)", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-pop)", width: "min(460px, 100%)", padding: 26 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
          <span style={{ width: 48, height: 48, borderRadius: "50%", background: "var(--danger-fill)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Trash2 size={22} color="var(--danger)" /></span>
          <h3 style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 20, color: "var(--fg-1)" }}>{title}</h3>
        </div>
        <p style={{ margin: "0 0 22px", color: "var(--fg-2)", fontSize: 15, lineHeight: 1.55 }}>{body}</p>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
          <button type="button" className="btn btn-neutral" onClick={onCancel} disabled={busy}>No, volver</button>
          <button type="button" className="btn" onClick={onConfirm} disabled={busy} style={{ background: "var(--danger)", boxShadow: "inset 0 -2px 0 var(--danger-fg)", color: "#fff" }}><Trash2 size={17} /> Sí, eliminar</button>
        </div>
      </div>
    </div>
  );
}

/* ---- Modal shell de formulario ----------------------------------------- */
export function GcrFormShell({ onCancel, children }: { onCancel: () => void; children: React.ReactNode }) {
  useEscape(onCancel);
  return (
    <div onMouseDown={(e) => { if (e.target === e.currentTarget) onCancel(); }} style={{ position: "fixed", inset: 0, zIndex: 70, background: "rgba(42,38,32,.45)", backdropFilter: "blur(2px)", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "40px 20px", overflowY: "auto" }}>
      <div className="pop" style={{ background: "var(--surface)", width: "min(680px, 100%)", maxHeight: "calc(100vh - 80px)", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-pop)", display: "flex", flexDirection: "column", overflow: "hidden", margin: "auto" }}>
        {children}
      </div>
    </div>
  );
}

export function GcrFormHeader({ eyebrow, title, sub, onCancel }: { eyebrow: string; title: string; sub?: string; onCancel: () => void }) {
  return (
    <div style={{ padding: "22px 26px", borderBottom: "1px solid var(--outline-variant)", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexShrink: 0 }}>
      <div style={{ minWidth: 0 }}>
        <div className="t-label" style={{ marginBottom: 6 }}>{eyebrow}</div>
        <h2 style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 24, color: "var(--fg-1)" }}>{title}</h2>
        {sub && <p style={{ margin: "6px 0 0", color: "var(--fg-2)", fontSize: 14, maxWidth: 480, lineHeight: 1.5 }}>{sub}</p>}
      </div>
      <button type="button" onClick={onCancel} aria-label="Cerrar" style={{ width: 42, height: 42, flexShrink: 0, borderRadius: "var(--radius)", border: "1px solid var(--outline-variant)", background: "var(--surface)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><X size={20} color="var(--fg-2)" /></button>
    </div>
  );
}

export function GcrFormFooter({ onCancel, onSave, saveLabel, saveIcon, busy }: { onCancel: () => void; onSave: () => void; saveLabel: string; saveIcon?: React.ReactNode; busy?: boolean }) {
  return (
    <div style={{ padding: "16px 26px", borderTop: "1px solid var(--outline-variant)", background: "var(--cream-tert)", display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 12, flexShrink: 0 }}>
      <button type="button" className="btn btn-neutral" onClick={onCancel} disabled={busy}>Cancelar</button>
      <button type="button" className="btn btn-primary" onClick={onSave} disabled={busy}>{saveIcon ?? <Check size={17} />} {saveLabel}</button>
    </div>
  );
}

export function GcrFieldLabel({ children, required, style }: { children: React.ReactNode; required?: boolean; style?: React.CSSProperties }) {
  return <label style={{ display: "block", fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 15.5, color: "var(--fg-1)", marginBottom: 8, ...style }}>{children}{required && <span style={{ color: "var(--danger)", marginLeft: 3 }}>*</span>}</label>;
}

export function GcrErr({ msg }: { msg: string }) {
  return <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--danger-fg)" }}><AlertCircle size={15} color="var(--danger)" /> {msg}</div>;
}

/* ---- Barra de estacionalidad (lectura) --------------------------------- */
export function GcrSeasonBar({ calendario }: { calendario: Estacion[] }) {
  return (
    <div style={{ display: "flex", gap: 2 }} title="Calendario de cosecha">
      {calendario.map((s, i) => {
        const est = GCR_ESTACIONES[s];
        return <span key={i} title={`${GCR_MESES[i]}: ${est.nombre}`} style={{ width: 19, height: 19, borderRadius: 4, background: est.swatch, opacity: s === "r" ? 0.42 : 1 }} />;
      })}
    </div>
  );
}

/* ---- Editor de estacionalidad ------------------------------------------ */
export function GcrSeasonEditor({ value, onChange }: { value: Estacion[]; onChange: (v: Estacion[]) => void }) {
  const cycle = (s: Estacion): Estacion => GCR_EST_ORDEN[(GCR_EST_ORDEN.indexOf(s) + 1) % GCR_EST_ORDEN.length];
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 8 }}>
        {value.map((s, i) => {
          const est = GCR_ESTACIONES[s];
          return (
            <button key={i} type="button" onClick={() => { const next = [...value]; next[i] = cycle(s); onChange(next); }} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, padding: "9px 6px", borderRadius: "var(--radius)", border: "1px solid " + est.bd, background: est.bg, cursor: "pointer" }}>
              <span style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 11.5, letterSpacing: ".04em", textTransform: "uppercase", color: est.fg }}>{GCR_MESES[i]}</span>
              <span style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={{ width: 9, height: 9, borderRadius: "50%", background: est.swatch }} /><span style={{ fontSize: 11, color: est.fg, fontWeight: 500 }}>{est.nombre}</span></span>
            </button>
          );
        })}
      </div>
      <div style={{ display: "flex", gap: 16, marginTop: 12, flexWrap: "wrap" }}>
        {GCR_EST_ORDEN.map((k) => { const e = GCR_ESTACIONES[k]; return <span key={k} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--fg-2)" }}><span style={{ width: 11, height: 11, borderRadius: 3, background: e.swatch }} />{e.nombre}</span>; })}
        <span style={{ fontSize: 11.5, color: "var(--fg-3)", marginLeft: "auto" }}>Tocá cada mes para cambiar su estado.</span>
      </div>
    </div>
  );
}

/* ---- Editor de lista (beneficios / ingredientes / pasos) --------------- */
export function GcrListEditor({ items, onChange, placeholder, numbered, addLabel, maxLength }: { items: string[]; onChange: (v: string[]) => void; placeholder: string; numbered?: boolean; addLabel: string; maxLength?: number }) {
  const update = (i: number, v: string) => { const next = [...items]; next[i] = v; onChange(next); };
  return (
    <div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {items.map((it, i) => (
          <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
            <span style={{ flexShrink: 0, marginTop: 5, width: 26, height: 26, borderRadius: numbered ? "var(--radius)" : "50%", background: "var(--green-050)", border: "1px solid var(--green-300)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: numbered ? "var(--font-mono)" : "var(--font-sans)", fontWeight: 700, fontSize: 12, color: "var(--green-800)" }}>{numbered ? i + 1 : <Check size={14} color="var(--green-800)" />}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <input value={it} placeholder={placeholder} maxLength={maxLength} onChange={(e) => update(i, e.target.value)} style={{ ...inputBase, fontSize: 14.5, padding: "10px 12px" }} />
              {maxLength && it.length >= Math.floor(maxLength * 0.8) && <div style={{ marginTop: 4, fontFamily: "var(--font-mono)", fontSize: 11, color: it.length >= maxLength ? "var(--danger)" : "var(--fg-3)", textAlign: "right" }}>{it.length}/{maxLength}</div>}
            </div>
            <button type="button" onClick={() => onChange(items.filter((_, idx) => idx !== i))} aria-label="Quitar" style={{ flexShrink: 0, width: 36, height: 36, borderRadius: "var(--radius)", border: "1px solid var(--outline-variant)", background: "var(--surface)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Trash2 size={16} color="var(--danger)" /></button>
          </div>
        ))}
      </div>
      <button type="button" onClick={() => onChange([...items, ""])} style={{ marginTop: 10, display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 12px", borderRadius: "var(--radius)", border: "1px dashed var(--brown-700)", background: "var(--surface)", color: "var(--brown-700)", fontFamily: "var(--font-sans)", fontSize: 13.5, fontWeight: 600, cursor: "pointer" }}><Plus size={16} color="var(--brown-700)" />{addLabel}</button>
    </div>
  );
}

/* ---- Multiselección de cultivos (chips) -------------------------------- */
export function GcrCultivoMultiSelect({ cultivos, selected, onChange }: { cultivos: GcrCultivo[]; selected: string[]; onChange: (v: string[]) => void }) {
  const toggle = (id: string) => onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      {cultivos.filter((c) => c.estado === "activo").map((c) => {
        const on = selected.includes(c.id);
        return (
          <button key={c.id} type="button" role="checkbox" aria-checked={on} onClick={() => toggle(c.id)} style={{ display: "inline-flex", alignItems: "center", gap: 9, padding: "7px 13px 7px 8px", borderRadius: "var(--radius-pill)", border: "1px solid " + (on ? "var(--green-800)" : "var(--outline-variant)"), background: on ? "var(--green-050)" : "var(--surface)", color: on ? "var(--green-800)" : "var(--fg-2)", fontFamily: "var(--font-sans)", fontSize: 13.5, fontWeight: on ? 600 : 500, cursor: "pointer", boxShadow: on ? "inset 0 -2px 0 var(--green-100)" : "none" }}>
            <span style={{ width: 20, height: 20, borderRadius: "50%", background: c.color, flexShrink: 0 }} />{c.nombre}{on && <Check size={15} color="var(--green-800)" />}
          </button>
        );
      })}
    </div>
  );
}

/* ---- Chip de cultivo (lectura) ----------------------------------------- */
export function GcrCultivoChip({ id, cultivos }: { id: string; cultivos: GcrCultivo[] }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "3px 10px 3px 4px", borderRadius: "var(--radius-pill)", background: "var(--cream-tert)", border: "1px solid var(--sand)", fontSize: 12.5, color: "var(--fg-1)", fontWeight: 500, whiteSpace: "nowrap" }}>
      <span style={{ width: 16, height: 16, borderRadius: "50%", background: gcrCultivoColor(id, cultivos), flexShrink: 0 }} />{gcrCultivoNombre(id, cultivos)}
    </span>
  );
}

/* ---- Pill de dificultad ------------------------------------------------ */
export function GcrDifficultyPill({ dificultad }: { dificultad: Dificultad }) {
  const map: Record<string, { bg: string; bd: string; fg: string }> = {
    "Fácil": { bg: "var(--green-050)", bd: "var(--green-300)", fg: "var(--green-800)" },
    "Media": { bg: "#FBF3D6", bd: "#E6CA72", fg: "#8A6D12" },
    "Difícil": { bg: "var(--danger-fill)", bd: "var(--danger)", fg: "var(--danger-fg)" },
  };
  const c = map[dificultad] || map["Media"];
  return <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: "var(--radius-pill)", background: c.bg, border: "1px solid " + c.bd, color: c.fg, fontSize: 12.5, fontWeight: 600, whiteSpace: "nowrap" }}><Gauge size={13} color={c.fg} />{dificultad}</span>;
}

/* ---- Tarjetas de estadística ------------------------------------------- */
export function GcrStats({ items }: { items: { icon: React.ReactNode; label: string; value: number }[] }) {
  return (
    <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 20 }}>
      {items.map((s) => (
        <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 12, background: "var(--surface)", border: "1px solid var(--outline-variant)", borderRadius: "var(--radius)", padding: "12px 16px", minWidth: 190 }}>
          <span style={{ width: 42, height: 42, borderRadius: 10, background: "var(--green-050)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{s.icon}</span>
          <span><span style={{ display: "block", fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 20, color: "var(--fg-1)" }}>{s.value}</span><span style={{ display: "block", fontSize: 12.5, color: "var(--fg-2)" }}>{s.label}</span></span>
        </div>
      ))}
    </div>
  );
}

/* ---- Barra de búsqueda ------------------------------------------------- */
export function GcrSearchBar({ query, onQuery, placeholder }: { query: string; onQuery: (v: string) => void; placeholder: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
      <div style={{ position: "relative", flex: 1, minWidth: 240 }}>
        <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", display: "flex" }}><Search size={17} color="var(--fg-3)" /></span>
        <input style={{ ...inputBase, paddingLeft: 42, fontSize: 15 }} placeholder={placeholder} value={query} onChange={(e) => onQuery(e.target.value)} />
      </div>
    </div>
  );
}

/* ---- Estado vacío ------------------------------------------------------ */
export function GcrEmptyState({ icon, title, body, actionLabel, onAction }: { icon: React.ReactNode; title: string; body: string; actionLabel: string; onAction: () => void }) {
  return (
    <div style={{ padding: "60px 28px", textAlign: "center" }}>
      <div style={{ width: 72, height: 72, borderRadius: "50%", background: "var(--cream-tert)", border: "1px solid var(--sand)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px" }}>{icon}</div>
      <h3 style={{ margin: "0 0 8px", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 21, color: "var(--fg-1)" }}>{title}</h3>
      <p style={{ margin: "0 auto 22px", color: "var(--fg-2)", fontSize: 15, lineHeight: 1.55, maxWidth: 440 }}>{body}</p>
      <button type="button" className="btn btn-primary" onClick={onAction}><Plus size={17} /> {actionLabel}</button>
    </div>
  );
}

/* ---- Encabezado de página ---------------------------------------------- */
export function GcrPageHead({ crumb, title, desc, actionLabel, onAction }: { crumb: string; title: string; desc: string; actionLabel: string; onAction: () => void }) {
  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--fg-3)", fontSize: 13.5, marginBottom: 14 }}>
        <span>Contenido</span><ChevronRight size={15} /><span style={{ color: "var(--fg-2)", fontWeight: 500 }}>{crumb}</span>
      </div>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 20, flexWrap: "wrap", marginBottom: 24 }}>
        <div style={{ minWidth: 280 }}>
          <h1 style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 32, color: "var(--fg-1)", letterSpacing: "-.01em" }}>{title}</h1>
          <p style={{ margin: "10px 0 0", color: "var(--fg-2)", fontSize: 15.5, lineHeight: 1.5, maxWidth: 680 }}>{desc}</p>
        </div>
        <button type="button" className="btn btn-primary btn-lg" onClick={onAction}><Plus size={18} /> {actionLabel}</button>
      </div>
    </>
  );
}

export function GcrNoMatch({ msg }: { msg: string }) {
  return <div style={{ padding: "56px 24px", textAlign: "center", color: "var(--fg-3)" }}><SearchX size={32} color="var(--fg-3)" /><div style={{ marginTop: 12, fontSize: 15 }}>{msg}</div></div>;
}
