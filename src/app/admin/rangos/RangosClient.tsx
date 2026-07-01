"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ChevronRight, Plus, UsersRound, AlertTriangle, Layers, X, Check, AlertCircle, Trash2, Clock,
  Info, CheckCircle2, Loader,
} from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import { genId } from "@/lib/id";
import { admNowStamp } from "@/data/admin";
import { RE_MIN_AGE, RE_MAX_AGE, RE_NOMBRE_RE, reAnalyze, reFmtRun } from "@/data/rangos";
import { useRangos, useGuardarRango, useBajaRango } from "@/hooks/useRangos";
import type { RangoEtario, Run } from "@/types/rangos";

const inputStyle: React.CSSProperties = { width: "100%", fontFamily: "var(--font-sans)", fontSize: 16, color: "var(--fg-1)", borderRadius: "var(--radius)", border: "1px solid var(--sand)", padding: "12px 14px", outline: "none", boxSizing: "border-box", background: "var(--surface)" };

function Err({ msg }: { msg: string }) {
  return <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 7, fontSize: 13, color: "var(--danger-fg)" }}><AlertCircle size={15} color="var(--danger)" /> {msg}</div>;
}

/* ---- Alerta de cobertura ----------------------------------------------- */
function CoverageAlert({ tone, title, runs }: { tone: "warning" | "danger"; title: string; runs: Run[] }) {
  const map = {
    warning: { fill: "var(--warning-fill)", border: "var(--warning)", fg: "var(--warning-fg)", ic: "var(--warning)", Icon: AlertTriangle },
    danger: { fill: "var(--danger-fill)", border: "var(--danger)", fg: "var(--danger-fg)", ic: "var(--danger)", Icon: Layers },
  }[tone];
  const I = map.Icon;
  return (
    <div role="alert" style={{ display: "flex", alignItems: "flex-start", gap: 14, background: map.fill, border: `1px solid ${map.border}`, borderRadius: "var(--radius)", padding: "14px 16px" }}>
      <span style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0, background: "var(--surface)", display: "flex", alignItems: "center", justifyContent: "center" }}><I size={18} color={map.ic} /></span>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15, color: map.fg, marginBottom: 5 }}>{title}</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>{runs.map((r, i) => <span key={i} style={{ fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 600, color: map.fg, background: "var(--surface)", border: `1px solid ${map.border}`, borderRadius: "var(--radius-pill)", padding: "3px 10px" }}>{reFmtRun(r)}</span>)}</div>
      </div>
    </div>
  );
}

/* ---- Formulario -------------------------------------------------------- */
function RangoForm({ initial, busy, onCancel, onSave }: { initial: RangoEtario | null; busy: boolean; onCancel: () => void; onSave: (r: RangoEtario) => void }) {
  const editing = !!initial;
  const [nombre, setNombre] = useState(initial?.nombre ?? "");
  const [min, setMin] = useState(initial ? String(initial.min) : "");
  const [max, setMax] = useState(initial ? String(initial.max) : "");
  const [attempted, setAttempted] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onCancel(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  const nt = nombre.trim();
  const errNombre = !nt ? "El nombre es requerido" : nt.length < 3 ? "El nombre debe tener al menos 3 caracteres." : nt.length > 40 ? "El nombre puede tener como máximo 40 caracteres." : !RE_NOMBRE_RE.test(nt) ? "El nombre solo puede contener letras y espacios, sin caracteres especiales." : "";
  const errMin = min.trim() === "" ? "Este campo es obligatorio" : !/^\d+$/.test(min.trim()) ? "Ingresá un número válido." : Number(min) < RE_MIN_AGE ? "La edad mínima no puede ser menor a 0." : Number(min) > RE_MAX_AGE ? "La edad no puede superar los 120 años." : "";
  const errMax = max.trim() === "" ? "Este campo es obligatorio" : !/^\d+$/.test(max.trim()) ? "Ingresá un número válido." : Number(max) < RE_MIN_AGE ? "La edad máxima no puede ser menor a 0." : Number(max) > RE_MAX_AGE ? "La edad no puede superar los 120 años." : (errMin === "" && Number(max) <= Number(min)) ? "La edad máxima debe ser mayor que la edad mínima." : "";

  function handleSave() {
    setAttempted(true);
    if (errNombre || errMin || errMax) return;
    const base = { nombre: nt, min: Number(min), max: Number(max), baja: null };
    onSave(editing ? { ...initial!, ...base } : { id: genId("r"), ...base });
  }

  const lbl: React.CSSProperties = { display: "block", fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 16, color: "var(--fg-1)", marginBottom: 8 };

  return (
    <div onMouseDown={(e) => { if (e.target === e.currentTarget) onCancel(); }} style={{ position: "fixed", inset: 0, zIndex: 60, background: "rgba(42,38,32,.45)", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "40px 20px", overflowY: "auto", backdropFilter: "blur(2px)" }}>
      <div className="pop" style={{ background: "var(--surface)", width: "min(600px, 100%)", maxHeight: "calc(100vh - 80px)", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-pop)", display: "flex", flexDirection: "column", overflow: "hidden", margin: "auto" }}>
        <div style={{ padding: "22px 26px", borderBottom: "1px solid var(--outline-variant)", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexShrink: 0 }}>
          <div>
            <div className="t-label" style={{ marginBottom: 6 }}>{editing ? "Modificar rango etario" : "Nuevo rango etario"}</div>
            <h2 style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 24, color: "var(--fg-1)" }}>{editing ? "Editar rango etario" : "Crear rango etario"}</h2>
            <p style={{ margin: "6px 0 0", color: "var(--fg-2)", fontSize: 14, maxWidth: 460, lineHeight: 1.5 }}>Definí un nombre y el rango de edades (mínima y máxima, ambas inclusive) que los productores podrán usar para diferenciar precios.</p>
          </div>
          <button type="button" onClick={onCancel} aria-label="Cerrar" style={{ width: 42, height: 42, flexShrink: 0, borderRadius: "var(--radius)", border: "1px solid var(--outline-variant)", background: "var(--surface)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><X size={20} color="var(--fg-2)" /></button>
        </div>
        <div style={{ padding: "22px 26px", overflowY: "auto", flex: 1, minHeight: 0, display: "flex", flexDirection: "column", gap: 20 }}>
          <div>
            <label htmlFor="re-nombre" style={lbl}>Nombre del rango etario <span style={{ color: "var(--danger)" }}>*</span></label>
            <input id="re-nombre" maxLength={40} autoComplete="off" placeholder="Ej.: Niños, Adultos, Jubilados" value={nombre} onChange={(e) => setNombre(e.target.value)} style={{ ...inputStyle, borderColor: attempted && errNombre ? "var(--danger)" : "var(--sand)" }} />
            {attempted && errNombre ? <Err msg={errNombre} /> : <p style={{ margin: "7px 0 0", fontSize: 12.5, color: "var(--fg-3)" }}>Solo letras y espacios. Entre 3 y 40 caracteres. {nt.length > 0 && <span style={{ fontFamily: "var(--font-mono)" }}>{nt.length}/40</span>}</p>}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <label htmlFor="re-min" style={lbl}>Edad mínima <span style={{ color: "var(--danger)" }}>*</span></label>
              <input id="re-min" inputMode="numeric" placeholder="0" value={min} onChange={(e) => setMin(e.target.value.replace(/[^0-9]/g, ""))} style={{ ...inputStyle, fontFamily: "var(--font-mono)", borderColor: attempted && errMin ? "var(--danger)" : "var(--sand)" }} />
              {attempted && errMin ? <Err msg={errMin} /> : <p style={{ margin: "7px 0 0", fontSize: 12.5, color: "var(--fg-3)" }}>Inclusive. De 0 a 120.</p>}
            </div>
            <div>
              <label htmlFor="re-max" style={lbl}>Edad máxima <span style={{ color: "var(--danger)" }}>*</span></label>
              <input id="re-max" inputMode="numeric" placeholder="0" value={max} onChange={(e) => setMax(e.target.value.replace(/[^0-9]/g, ""))} style={{ ...inputStyle, fontFamily: "var(--font-mono)", borderColor: attempted && errMax ? "var(--danger)" : "var(--sand)" }} />
              {attempted && errMax ? <Err msg={errMax} /> : <p style={{ margin: "7px 0 0", fontSize: 12.5, color: "var(--fg-3)" }}>Inclusive. Mayor que la mínima, hasta 120.</p>}
            </div>
          </div>
        </div>
        <div style={{ padding: "16px 26px", borderTop: "1px solid var(--outline-variant)", background: "var(--cream-tert)", display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 12, flexShrink: 0 }}>
          <button type="button" className="btn btn-neutral" onClick={onCancel} disabled={busy}>Cancelar</button>
          <button type="button" className="btn btn-primary" onClick={handleSave} disabled={busy}>{busy ? <Loader size={17} className="spin" /> : editing ? <Check size={17} /> : <Plus size={17} />} {editing ? "Guardar cambios" : "Guardar"}</button>
        </div>
      </div>
    </div>
  );
}

/* ---- Inner ------------------------------------------------------------- */
function Inner({ initial }: { initial: RangoEtario[] }) {
  const [rangos, setRangos] = useState<RangoEtario[]>(initial);
  const [form, setForm] = useState<{ open: boolean; initial: RangoEtario | null } | null>(null);
  const [toBaja, setToBaja] = useState<RangoEtario | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const { guardar, isLoading: saving } = useGuardarRango();
  const { darBaja, isLoading: deleting } = useBajaRango();

  const activos = rangos.filter((r) => !r.baja).length;
  const { gaps, overlaps } = useMemo(() => reAnalyze(rangos), [rangos]);
  const notify = (msg: string) => { setFlash(msg); setTimeout(() => setFlash((f) => (f === msg ? null : f)), 3400); };

  async function saveRango(rango: RangoEtario) {
    const editing = rangos.some((r) => r.id === rango.id);
    await guardar(rango);
    setRangos((prev) => (editing ? prev.map((r) => (r.id === rango.id ? rango : r)) : [...prev, rango]));
    setForm(null);
    notify(editing ? "Rango etario actualizado con éxito" : "Nuevo rango etario creado con éxito");
  }
  async function confirmBaja() {
    if (!toBaja) return;
    const rango = toBaja;
    await darBaja(rango.id);
    const stamp = admNowStamp();
    setRangos((prev) => prev.map((r) => (r.id === rango.id ? { ...r, baja: stamp } : r)));
    setToBaja(null);
    notify("Rango etario dado de baja");
  }

  const kpis = [
    { Icon: UsersRound, label: "Rangos activos", value: activos, tone: null as null | "warning" | "danger" },
    { Icon: AlertTriangle, label: "Edades sin cubrir", value: gaps.length, tone: gaps.length ? "warning" as const : null },
    { Icon: Layers, label: "Tramos solapados", value: overlaps.length, tone: overlaps.length ? "danger" as const : null },
  ];
  const th: React.CSSProperties = { textAlign: "left", fontWeight: 700, color: "var(--fg-2)", fontSize: 12.5, textTransform: "uppercase", letterSpacing: ".05em", padding: "14px 16px", borderBottom: "2px solid var(--outline-variant)", whiteSpace: "nowrap" };
  const ageStyle: React.CSSProperties = { fontFamily: "var(--font-mono)", fontSize: 15, fontWeight: 600, color: "var(--fg-1)" };

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 28px 72px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--fg-3)", fontSize: 13.5, marginBottom: 14 }}><span>Parámetros</span><ChevronRight size={15} /><span style={{ color: "var(--fg-2)", fontWeight: 500 }}>Rangos etarios</span></div>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 20, flexWrap: "wrap", marginBottom: 24 }}>
        <div style={{ minWidth: 280 }}>
          <h1 style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 32, color: "var(--fg-1)", letterSpacing: "-.01em" }}>Gestión del rango etario</h1>
          <p style={{ margin: "10px 0 0", color: "var(--fg-2)", fontSize: 15.5, lineHeight: 1.5, maxWidth: 660 }}>Definí los rangos de edad de los visitantes. Los productores los usan para asignar precios diferenciados a sus actividades según la edad.</p>
        </div>
        <button type="button" className="btn btn-primary btn-lg" onClick={() => setForm({ open: true, initial: null })}><Plus size={18} /> Crear rango etario</button>
      </div>

      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 20 }}>
        {kpis.map((s) => (
          <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 12, background: "var(--surface)", border: "1px solid var(--outline-variant)", borderRadius: "var(--radius)", padding: "12px 16px", minWidth: 180 }}>
            <span style={{ width: 42, height: 42, borderRadius: 10, background: s.tone === "warning" ? "var(--warning-fill)" : s.tone === "danger" ? "var(--danger-fill)" : "var(--green-050)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><s.Icon size={20} color={s.tone === "warning" ? "var(--warning)" : s.tone === "danger" ? "var(--danger)" : "var(--green-800)"} /></span>
            <span><span style={{ display: "block", fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 20, color: "var(--fg-1)" }}>{s.value}</span><span style={{ display: "block", fontSize: 12.5, color: "var(--fg-2)" }}>{s.label}</span></span>
          </div>
        ))}
      </div>

      {(gaps.length > 0 || overlaps.length > 0) && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
          {gaps.length > 0 && <CoverageAlert tone="warning" title="Hay edades que no están incluidas en ningún rango etario" runs={gaps} />}
          {overlaps.length > 0 && <CoverageAlert tone="danger" title="Hay edades solapadas entre rangos etarios" runs={overlaps} />}
        </div>
      )}

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 760 }}>
            <thead><tr>{["Rango etario", "Edad mínima", "Edad máxima", "Acciones"].map((h, i) => <th key={h} style={{ ...th, textAlign: i === 3 ? "right" : "left" }}>{h}</th>)}</tr></thead>
            <tbody>
              {rangos.map((r) => {
                const baja = !!r.baja;
                return (
                  <tr key={r.id} style={{ borderBottom: "1px solid var(--cream-tert)", background: baja ? "var(--cream-tert)" : "transparent", opacity: baja ? 0.62 : 1 }}>
                    <td style={{ padding: "14px 16px", verticalAlign: "middle" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <span style={{ width: 38, height: 38, borderRadius: 10, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: baja ? "var(--surface)" : "var(--green-050)", border: "1px solid " + (baja ? "var(--outline-variant)" : "var(--green-300)") }}><UsersRound size={17} color={baja ? "var(--fg-3)" : "var(--green-800)"} /></span>
                        <span style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                          <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 16, color: "var(--fg-1)", textDecoration: baja ? "line-through" : "none" }}>{r.nombre}</span>
                          {baja && <span style={{ fontSize: 11.5, fontWeight: 600, color: "var(--fg-2)", background: "var(--surface)", border: "1px solid var(--outline-variant)", borderRadius: "var(--radius-pill)", padding: "3px 10px" }}>Dado de baja</span>}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: "14px 16px", verticalAlign: "middle" }}><span style={ageStyle}>{r.min} <span style={{ color: "var(--fg-3)", fontWeight: 400 }}>años</span></span></td>
                    <td style={{ padding: "14px 16px", verticalAlign: "middle" }}><span style={ageStyle}>{r.max} <span style={{ color: "var(--fg-3)", fontWeight: 400 }}>años</span></span></td>
                    <td style={{ padding: "14px 16px", verticalAlign: "middle" }}>
                      {baja ? (
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2 }}>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--fg-3)", textTransform: "uppercase", letterSpacing: ".05em", fontWeight: 600 }}><Clock size={13} color="var(--fg-3)" />Baja</span>
                          <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--fg-2)" }}>{r.baja}</span>
                        </div>
                      ) : (
                        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                          <button type="button" className="btn btn-sm" onClick={() => setForm({ open: true, initial: r })} style={{ border: "1px solid var(--sand)", background: "var(--surface)", color: "var(--green-800)" }}>Editar</button>
                          <button type="button" className="btn btn-sm" onClick={() => setToBaja(r)} style={{ border: "1px solid var(--danger)", background: "var(--surface)", color: "var(--danger)" }}><Trash2 size={15} /> Eliminar</button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 9, marginTop: 16, color: "var(--fg-3)", fontSize: 13 }}><Info size={16} color="var(--fg-3)" />Los rangos dados de baja se muestran atenuados con su fecha y hora de baja, y se excluyen del control de cobertura.</div>

      {form?.open && <RangoForm initial={form.initial} busy={saving} onCancel={() => setForm(null)} onSave={saveRango} />}
      {toBaja && (
        <div onMouseDown={(e) => { if (e.target === e.currentTarget) setToBaja(null); }} style={{ position: "fixed", inset: 0, zIndex: 70, background: "rgba(42,38,32,.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, backdropFilter: "blur(2px)" }}>
          <div className="pop" style={{ background: "var(--surface)", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-pop)", width: "min(460px, 100%)", padding: 26 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
              <span style={{ width: 48, height: 48, borderRadius: "50%", background: "var(--danger-fill)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Trash2 size={22} color="var(--danger)" /></span>
              <h3 style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 20, color: "var(--fg-1)" }}>Eliminar rango etario</h3>
            </div>
            <p style={{ margin: "0 0 22px", color: "var(--fg-2)", fontSize: 15, lineHeight: 1.55 }}>¿Seguro que querés dar de baja <strong style={{ color: "var(--fg-1)" }}>{toBaja.nombre}</strong> ({toBaja.min} a {toBaja.max} años)? Quedará registrado con la fecha y hora de baja, y los productores ya no podrán usarlo.</p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
              <button type="button" className="btn btn-neutral" onClick={() => setToBaja(null)} disabled={deleting}>No, volver</button>
              <button type="button" className="btn" onClick={confirmBaja} disabled={deleting} style={{ background: "var(--danger)", boxShadow: "inset 0 -2px 0 var(--danger-fg)", color: "#fff" }}>{deleting ? <Loader size={17} className="spin" /> : <Trash2 size={17} />} Sí, dar de baja</button>
            </div>
          </div>
        </div>
      )}
      {flash && <div className="pop" style={{ position: "fixed", right: 24, bottom: 24, zIndex: 90, maxWidth: 420, background: "var(--green-800)", color: "#fff", borderRadius: "var(--radius)", padding: "14px 20px", display: "flex", alignItems: "center", gap: 10, boxShadow: "var(--shadow-pop)", fontSize: 15, fontWeight: 500 }}><CheckCircle2 size={20} color="#fff" />{flash}</div>}
    </div>
  );
}

export default function RangosClient() {
  const { data, isLoading } = useRangos();
  return (
    <AdminShell active="rangos">
      {isLoading || !data ? (
        <div style={{ padding: "120px 28px", textAlign: "center", color: "var(--fg-3)" }}><Loader size={26} className="spin" /><div style={{ marginTop: 12, fontSize: 14 }}>Cargando rangos etarios…</div></div>
      ) : (
        <Inner initial={data} />
      )}
    </AdminShell>
  );
}
