"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ChevronRight, Inbox, CircleDot, Loader, CheckCircle2, XCircle, List as ListIcon, Settings2,
  ArrowDownWideNarrow, FilterX, ClipboardCheck, X, Check, Lock, Info, CalendarCheck, AlertCircle,
} from "lucide-react";
import AsyncBoundary from "@/components/AsyncBoundary";
import AdminShell from "@/components/admin/AdminShell";
import { Pagination } from "@/components/catalog/controls";
import { admInitials } from "@/data/admin";
import { fmtFechaHora } from "@/lib/format";
import { GI_ESTADOS, GI_ORDEN_ESTADOS, giEsTerminal, giResumen, giOrdenarDesc } from "@/data/incidencias";
import { useIncidencias, useGuardarIncidencia } from "@/hooks/useIncidencias";
import type { EstadoIncidencia, Incidencia } from "@/types/incidencias";

const POR_PAGINA = 10;
const MOTIVO_MAX = 2000;

const TONE: Record<string, { bg: string; fg: string }> = {
  info: { bg: "var(--info-fill)", fg: "var(--info-fg)" },
  warning: { bg: "var(--warning-fill)", fg: "var(--warning-fg)" },
  success: { bg: "var(--success-fill)", fg: "var(--success-fg)" },
  neutral: { bg: "var(--cream-tert)", fg: "var(--fg-2)" },
};
const ICON: Record<EstadoIncidencia, React.ComponentType<{ size?: number; color?: string }>> = {
  reportada: CircleDot, revision: Loader, resuelta: CheckCircle2, desestimada: XCircle,
};

function nowISO(): string {
  return new Date().toISOString().slice(0, 16);
}

function EstadoPill({ estado }: { estado: EstadoIncidencia }) {
  const m = GI_ESTADOS[estado];
  const t = TONE[m.tone];
  const I = ICON[estado];
  return <span style={{ display: "inline-flex", alignItems: "center", gap: 6, borderRadius: "var(--radius-pill)", padding: "4px 11px", fontSize: 12.5, fontWeight: 700, background: t.bg, color: t.fg, whiteSpace: "nowrap" }}><I size={13} color={t.fg} /> {m.label}</span>;
}

/* ---- Modal gestionar --------------------------------------------------- */
function GestionarModal({ incidencia, busy, onCancel, onGuardar }: { incidencia: Incidencia; busy: boolean; onCancel: () => void; onGuardar: (estado: EstadoIncidencia, motivo: string | null) => void }) {
  const terminal = giEsTerminal(incidencia.estado);
  const [estado, setEstado] = useState<EstadoIncidencia>(incidencia.estado);
  const [motivo, setMotivo] = useState("");
  const [motivoErr, setMotivoErr] = useState("");

  const requiereMotivo = giEsTerminal(estado);
  const cambio = estado !== incidencia.estado;
  const previewFechaFin = giEsTerminal(estado) ? nowISO() : null;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onCancel(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  function cambiarEstado(id: EstadoIncidencia) {
    if (terminal) return;
    setEstado(id);
    if (!giEsTerminal(id)) { setMotivo(""); setMotivoErr(""); }
  }

  function guardar() {
    if (terminal || !cambio) return;
    if (requiereMotivo && !motivo.trim()) { setMotivoErr("Ingresá el motivo para cerrar la incidencia."); return; }
    onGuardar(estado, requiereMotivo ? motivo.trim() : null);
  }

  const lbl: React.CSSProperties = { display: "block", fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 14.5, color: "var(--fg-1)", marginBottom: 9 };
  const ta: React.CSSProperties = { width: "100%", fontFamily: "var(--font-sans)", fontSize: 14.5, color: "var(--fg-1)", borderRadius: "var(--radius)", border: "1px solid var(--sand)", padding: "12px 14px", outline: "none", boxSizing: "border-box", lineHeight: 1.55 };

  return (
    <div onMouseDown={(e) => { if (e.target === e.currentTarget) onCancel(); }} style={{ position: "fixed", inset: 0, zIndex: 70, background: "rgba(42,38,32,.45)", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "40px 20px", overflowY: "auto", backdropFilter: "blur(2px)" }}>
      <div className="pop" style={{ background: "var(--surface)", width: "min(620px, 100%)", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-pop)", margin: "auto", display: "flex", flexDirection: "column", overflow: "hidden", maxHeight: "calc(100vh - 80px)" }}>
        <div style={{ padding: "22px 26px", borderBottom: "1px solid var(--outline-variant)", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}><span className="t-label">Gestionar incidencia</span><span style={{ fontFamily: "var(--font-mono)", fontSize: 11.5, color: "var(--fg-3)" }}>{incidencia.id}</span></div>
            <h2 style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 21, color: "var(--fg-1)", lineHeight: 1.25 }}>{incidencia.titulo}</h2>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 9, fontSize: 13, color: "var(--fg-2)" }}>Reportada por <strong style={{ color: "var(--fg-1)", fontWeight: 600 }}>{incidencia.usuario}</strong></div>
          </div>
          <button type="button" onClick={onCancel} aria-label="Cerrar" style={{ width: 42, height: 42, flexShrink: 0, borderRadius: "var(--radius)", border: "1px solid var(--outline-variant)", background: "var(--surface)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><X size={20} color="var(--fg-2)" /></button>
        </div>

        <div style={{ padding: "22px 26px", display: "flex", flexDirection: "column", gap: 20, overflowY: "auto" }}>
          <div>
            <label style={lbl}>Descripción completa</label>
            <textarea value={incidencia.desc} disabled rows={4} style={{ ...ta, resize: "none", background: "var(--cream-tert)", cursor: "default" }} />
            <p style={{ margin: "7px 0 0", fontSize: 12, color: "var(--fg-3)", display: "flex", alignItems: "center", gap: 6 }}><Lock size={13} color="var(--fg-3)" /> El contenido reportado por el usuario no se puede modificar.</p>
          </div>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {[["Fecha de inicio", incidencia.fechaInicio], ["Fecha de fin", incidencia.fechaFin]].map(([label, v]) => (
              <div key={label} style={{ flex: 1, minWidth: 180, border: "1px solid var(--outline-variant)", borderRadius: "var(--radius)", padding: "11px 14px" }}>
                <span className="t-label" style={{ display: "block", marginBottom: 5 }}>{label}</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 14, color: v ? "var(--fg-1)" : "var(--fg-3)" }}>{fmtFechaHora(v as string | null)}</span>
              </div>
            ))}
          </div>

          <div>
            <label style={lbl}>Estado de la incidencia</label>
            <div role="radiogroup" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {GI_ORDEN_ESTADOS.map((id) => {
                const e = GI_ESTADOS[id];
                const checked = estado === id;
                const I = ICON[id];
                return (
                  <button key={id} type="button" role="radio" aria-checked={checked} disabled={terminal} onClick={() => cambiarEstado(id)} style={{ display: "flex", alignItems: "center", gap: 13, width: "100%", textAlign: "left", background: checked ? "var(--green-050)" : "var(--surface)", border: "1px solid " + (checked ? "var(--green-800)" : "var(--outline-variant)"), boxShadow: checked && !terminal ? "inset 0 -2px 0 var(--green-100)" : "none", borderRadius: "var(--radius)", padding: "11px 14px", cursor: terminal ? "not-allowed" : "pointer", opacity: terminal && !checked ? 0.5 : 1 }}>
                    <span style={{ width: 20, height: 20, borderRadius: "50%", flexShrink: 0, border: "2px solid " + (checked ? "var(--green-800)" : "var(--sand)"), background: "var(--surface)", display: "flex", alignItems: "center", justifyContent: "center" }}>{checked && <span style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--green-800)" }} />}</span>
                    <span style={{ flex: 1, display: "flex", alignItems: "center", gap: 9 }}><I size={17} color={checked ? "var(--green-800)" : "var(--fg-3)"} /><span style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 15, color: checked ? "var(--green-800)" : "var(--fg-1)" }}>{e.label}</span></span>
                  </button>
                );
              })}
            </div>
            {terminal ? (
              <div style={{ display: "flex", alignItems: "flex-start", gap: 9, marginTop: 12, padding: "10px 13px", borderRadius: "var(--radius)", background: "var(--cream-tert)", border: "1px solid var(--outline-variant)" }}><Info size={16} color="var(--fg-2)" style={{ marginTop: 1 }} /><span style={{ fontSize: 13, color: "var(--fg-2)", lineHeight: 1.5 }}>Esta incidencia ya está <strong style={{ color: "var(--fg-1)" }}>{GI_ESTADOS[incidencia.estado].label.toLowerCase()}</strong> y quedó cerrada el {fmtFechaHora(incidencia.fechaFin)}. El estado no se puede volver a cambiar.</span></div>
            ) : giEsTerminal(estado) ? (
              <div style={{ display: "flex", alignItems: "flex-start", gap: 9, marginTop: 12, padding: "10px 13px", borderRadius: "var(--radius)", background: "var(--green-050)", border: "1px solid var(--green-300)" }}><CalendarCheck size={16} color="var(--green-800)" style={{ marginTop: 1 }} /><span style={{ fontSize: 13, color: "var(--green-800)", lineHeight: 1.5 }}>Al guardar, la incidencia quedará cerrada con fecha de fin <strong>{fmtFechaHora(previewFechaFin)}</strong> y su estado no podrá cambiarse nuevamente.</span></div>
            ) : null}
          </div>

          {!terminal && (
            <div>
              <label style={lbl} htmlFor="gi-motivo">Motivo {requiereMotivo && <span style={{ color: "var(--danger-fg)", fontWeight: 700 }}>*</span>}</label>
              <textarea id="gi-motivo" value={motivo} onChange={(e) => { setMotivo(e.target.value.slice(0, MOTIVO_MAX)); if (motivoErr && e.target.value.trim()) setMotivoErr(""); }} disabled={!requiereMotivo} maxLength={MOTIVO_MAX} rows={4} placeholder={requiereMotivo ? "Detallá por qué se resolvió o desestimó la incidencia…" : "Seleccioná «Resuelta» o «Desestimada» para cargar el motivo."} style={{ ...ta, minHeight: 96, resize: "vertical", borderColor: motivoErr ? "var(--danger)" : "var(--sand)", background: requiereMotivo ? "var(--surface)" : "var(--cream-tert)", cursor: requiereMotivo ? "text" : "not-allowed", color: requiereMotivo ? "var(--fg-1)" : "var(--fg-3)" }} />
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginTop: 7 }}>
                {motivoErr ? <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, color: "var(--danger-fg)" }}><AlertCircle size={14} color="var(--danger)" /> {motivoErr}</span> : <span style={{ fontSize: 12, color: "var(--fg-3)", display: "flex", alignItems: "center", gap: 6 }}><Info size={13} color="var(--fg-3)" /> {requiereMotivo ? "Campo obligatorio. Quedará registrado junto al cierre." : "Se habilita al pasar a un estado terminal."}</span>}
                <span style={{ flexShrink: 0, fontFamily: "var(--font-mono)", fontSize: 11.5, color: motivo.length >= MOTIVO_MAX ? "var(--danger)" : "var(--fg-3)" }}>{motivo.length}/{MOTIVO_MAX}</span>
              </div>
            </div>
          )}
        </div>

        <div style={{ padding: "16px 26px", borderTop: "1px solid var(--outline-variant)", background: "var(--cream-tert)", display: "flex", justifyContent: "flex-end", gap: 12 }}>
          <button type="button" className="btn btn-neutral" onClick={onCancel} disabled={busy}><X size={17} /> Cancelar</button>
          <button type="button" className="btn btn-primary" disabled={terminal || !cambio || busy} onClick={guardar}>{busy ? <Loader size={17} className="spin" /> : <Check size={17} />} Guardar</button>
        </div>
      </div>
    </div>
  );
}

/* ---- Inner ------------------------------------------------------------- */
function Inner({ initial }: { initial: Incidencia[] }) {
  const [incidencias, setIncidencias] = useState<Incidencia[]>(initial);
  const [filtro, setFiltro] = useState<"todas" | EstadoIncidencia>("todas");
  const [pagina, setPagina] = useState(1);
  const [gestionando, setGestionando] = useState<Incidencia | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const { guardar, isLoading } = useGuardarIncidencia();

  const ordenadas = useMemo(() => giOrdenarDesc(incidencias), [incidencias]);
  const conteos = useMemo(() => {
    const c: Record<string, number> = { todas: ordenadas.length };
    GI_ORDEN_ESTADOS.forEach((e) => { c[e] = ordenadas.filter((i) => i.estado === e).length; });
    return c;
  }, [ordenadas]);
  const filtradas = useMemo(() => (filtro === "todas" ? ordenadas : ordenadas.filter((i) => i.estado === filtro)), [ordenadas, filtro]);
  const totalAbiertas = incidencias.filter((i) => !giEsTerminal(i.estado)).length;

  const totalPaginas = Math.max(1, Math.ceil(filtradas.length / POR_PAGINA));
  const paginaSafe = Math.min(pagina, totalPaginas);
  const desde = (paginaSafe - 1) * POR_PAGINA;
  const pagey = filtradas.slice(desde, desde + POR_PAGINA);

  function notify(msg: string) { setToast(msg); setTimeout(() => setToast((t) => (t === msg ? null : t)), 4000); }

  async function onGuardar(estado: EstadoIncidencia, motivo: string | null) {
    if (!gestionando) return;
    await guardar(gestionando.id, estado, motivo);
    const fechaFin = giEsTerminal(estado) ? nowISO() : null;
    setIncidencias((prev) => prev.map((i) => (i.id === gestionando.id ? { ...i, estado, fechaFin, motivo } : i)));
    setGestionando(null);
    notify(`Incidencia ${gestionando.id} actualizada a «${GI_ESTADOS[estado].label}».`);
  }

  const tabs = [{ id: "todas" as const, label: "Todas", I: ListIcon }, ...GI_ORDEN_ESTADOS.map((id) => ({ id, label: GI_ESTADOS[id].label, I: ICON[id] }))];
  const th: React.CSSProperties = { textAlign: "left", fontWeight: 700, color: "var(--fg-2)", fontSize: 12.5, textTransform: "uppercase", letterSpacing: ".05em", padding: "14px 16px", borderBottom: "2px solid var(--outline-variant)", whiteSpace: "nowrap" };

  return (
    <div style={{ maxWidth: 1240, margin: "0 auto", padding: "28px 28px 72px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--fg-3)", fontSize: 13.5, marginBottom: 14 }}><span>Soporte</span><ChevronRight size={15} /><span style={{ color: "var(--fg-2)", fontWeight: 500 }}>Gestionar incidencias</span></div>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 20, flexWrap: "wrap", marginBottom: 24 }}>
        <div style={{ minWidth: 280 }}>
          <h1 style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 32, color: "var(--fg-1)", letterSpacing: "-.01em" }}>Gestionar incidencias</h1>
          <p style={{ margin: "10px 0 0", color: "var(--fg-2)", fontSize: 15.5, lineHeight: 1.5, maxWidth: 680 }}>Seguí las incidencias reportadas por los usuarios y actualizá su estado para asegurar que cada problema sea atendido y resuelto.</p>
        </div>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 11, background: "var(--surface)", border: "1px solid var(--outline-variant)", borderRadius: "var(--radius)", padding: "11px 16px" }}>
          <span style={{ width: 42, height: 42, borderRadius: 10, background: "var(--green-050)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Inbox size={20} color="var(--green-800)" /></span>
          <span><span style={{ display: "block", fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 20, color: "var(--fg-1)" }}>{totalAbiertas}</span><span style={{ display: "block", fontSize: 12.5, color: "var(--fg-2)" }}>{totalAbiertas === 1 ? "incidencia abierta" : "incidencias abiertas"}</span></span>
        </div>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
        {tabs.map((t) => {
          const on = filtro === t.id;
          return (
            <button key={t.id} type="button" onClick={() => { setFiltro(t.id); setPagina(1); }} style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 13px", borderRadius: "var(--radius-pill)", border: "1px solid " + (on ? "var(--green-800)" : "var(--sand)"), background: on ? "var(--green-800)" : "var(--surface)", color: on ? "#fff" : "var(--fg-2)", fontWeight: 600, fontSize: 13.5, cursor: "pointer", whiteSpace: "nowrap" }}>
              <t.I size={15} color={on ? "#fff" : "var(--fg-3)"} /> {t.label}
              <span style={{ minWidth: 20, height: 19, padding: "0 6px", borderRadius: 10, display: "inline-flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-mono)", fontSize: 11.5, fontWeight: 700, background: on ? "rgba(255,255,255,.22)" : "var(--cream-tert)", color: on ? "#fff" : "var(--fg-2)" }}>{conteos[t.id] || 0}</span>
            </button>
          );
        })}
      </div>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {filtradas.length === 0 ? (
          <div style={{ padding: "64px 32px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
            <span style={{ width: 64, height: 64, borderRadius: 16, background: "var(--green-050)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 18 }}>{filtro !== "todas" ? <FilterX size={30} color="var(--green-800)" /> : <ClipboardCheck size={30} color="var(--green-800)" />}</span>
            <h2 style={{ margin: "0 0 8px", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 20, color: "var(--fg-1)" }}>{filtro !== "todas" ? "No hay incidencias con ese estado" : "No hay incidencias reportadas"}</h2>
            <p style={{ margin: 0, color: "var(--fg-2)", fontSize: 15, maxWidth: 440 }}>{filtro !== "todas" ? "Probá con otro estado o seleccioná «Todas» para ver el listado completo." : "Cuando los usuarios reporten un problema, vas a poder darle seguimiento desde acá."}</p>
          </div>
        ) : (
          <>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", padding: "13px 16px", borderBottom: "1px solid var(--outline-variant)" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 13.5, color: "var(--fg-3)" }}><ArrowDownWideNarrow size={15} color="var(--fg-3)" /> Ordenadas por fecha de creación · más recientes primero</span>
              <span style={{ fontSize: 13.5, color: "var(--fg-2)", fontWeight: 600 }}>{filtradas.length} {filtradas.length === 1 ? "incidencia" : "incidencias"}</span>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 1040 }}>
                <thead><tr>{["Incidencia", "Denunciante", "Descripción", "Fecha inicio", "Fecha fin", "Estado", "Acción"].map((c, i) => <th key={c} style={{ ...th, textAlign: i === 6 ? "right" : "left" }}>{c}</th>)}</tr></thead>
                <tbody>
                  {pagey.map((inc, idx) => (
                    <tr key={inc.id} style={{ borderBottom: "1px solid var(--cream-tert)", background: idx % 2 ? "var(--cream-tert)" : "transparent" }}>
                      <td style={{ padding: "14px 16px", maxWidth: 320 }}>
                        <span style={{ display: "block", fontFamily: "var(--font-mono)", fontSize: 11.5, color: "var(--fg-3)", marginBottom: 3 }}>{inc.id}</span>
                        <span style={{ display: "block", fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 15, color: "var(--fg-1)", lineHeight: 1.3 }}>{inc.titulo}</span>
                      </td>
                      <td style={{ padding: "14px 16px", whiteSpace: "nowrap" }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 9 }}><span style={{ width: 30, height: 30, borderRadius: "50%", flexShrink: 0, background: "var(--brown-700)", color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 12 }}>{admInitials(inc.usuario)}</span><span style={{ fontSize: 14, color: "var(--fg-1)" }}>{inc.usuario}</span></span>
                      </td>
                      <td style={{ padding: "14px 16px" }}><span title={inc.desc} style={{ fontSize: 14, color: "var(--fg-2)" }}>{giResumen(inc.desc, 20)}</span></td>
                      <td style={{ padding: "14px 16px", whiteSpace: "nowrap", fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--fg-1)" }}>{fmtFechaHora(inc.fechaInicio)}</td>
                      <td style={{ padding: "14px 16px", whiteSpace: "nowrap", fontFamily: "var(--font-mono)", fontSize: 13, color: inc.fechaFin ? "var(--fg-1)" : "var(--fg-3)" }}>{fmtFechaHora(inc.fechaFin)}</td>
                      <td style={{ padding: "14px 16px" }}><EstadoPill estado={inc.estado} /></td>
                      <td style={{ padding: "14px 16px", textAlign: "right" }}><button type="button" className="btn btn-neutral btn-sm" onClick={() => setGestionando(inc)}><Settings2 size={15} /> Gestionar</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {filtradas.length > 0 && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginTop: 18 }}>
          <span style={{ fontSize: 13, color: "var(--fg-3)" }}>Mostrando {desde + 1}–{Math.min(desde + POR_PAGINA, filtradas.length)} de {filtradas.length}</span>
          <Pagination page={paginaSafe} pages={totalPaginas} onPage={setPagina} />
        </div>
      )}

      {gestionando && <GestionarModal incidencia={gestionando} busy={isLoading} onCancel={() => setGestionando(null)} onGuardar={onGuardar} />}
      {toast && <div className="pop" style={{ position: "fixed", right: 24, bottom: 24, zIndex: 90, maxWidth: 400, background: "var(--green-800)", color: "#fff", borderRadius: "var(--radius)", padding: "14px 18px", display: "flex", alignItems: "center", gap: 11, fontWeight: 500, fontSize: 14.5, boxShadow: "var(--shadow-pop)" }}><CheckCircle2 size={19} color="#fff" /> {toast}</div>}
    </div>
  );
}

export default function IncidenciasClient() {
  const { data, isLoading, error, reload } = useIncidencias();
  return (
    <AdminShell active="incidencias">
      <AsyncBoundary loading={isLoading} error={error} onRetry={reload} loadingLabel="Cargando incidencias…">
        {data && <Inner initial={data} />}
      </AsyncBoundary>
    </AdminShell>
  );
}
