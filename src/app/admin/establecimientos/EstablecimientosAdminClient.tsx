"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import {
  ChevronRight, Search, Warehouse, Ban, List as ListIcon, User, MapPin, Grape, CalendarCheck,
  RotateCcw, AlertTriangle, Clock, AlertCircle, Check, CheckCircle2, SearchX, Loader,
} from "lucide-react";
import AsyncBoundary from "@/components/AsyncBoundary";
import { admNowStamp, estabInitials } from "@/data/admin";
import { useEstablecimientosAdmin, useModerarEstablecimiento } from "@/hooks/useEstablecimientosAdmin";
import type { AdminEstab } from "@/types/admin";

function pill(tone: "success" | "danger"): React.CSSProperties {
  const map = { success: { bg: "var(--success-fill)", fg: "var(--success-fg)" }, danger: { bg: "var(--danger-fill)", fg: "var(--danger-fg)" } }[tone];
  return { display: "inline-flex", alignItems: "center", borderRadius: "var(--radius-pill)", padding: "4px 11px", fontSize: 12.5, fontWeight: 700, background: map.bg, color: map.fg };
}

function ActionBtn({ icon, label, tone, title, onClick }: { icon: React.ReactNode; label: string; tone: "danger" | "success"; title: string; onClick: () => void }) {
  const success = tone === "success";
  return (
    <button type="button" onClick={onClick} title={title} style={{ display: "inline-flex", alignItems: "center", gap: 8, fontWeight: 600, fontSize: 14, padding: "8px 12px", borderRadius: "var(--radius)", border: "1px solid " + (success ? "var(--green-800)" : "var(--danger)"), background: success ? "var(--green-800)" : "var(--surface)", color: success ? "#fff" : "var(--danger)", cursor: "pointer", whiteSpace: "nowrap", boxShadow: success ? "inset 0 -2px 0 var(--green-900)" : "none" }}>{icon} {label}</button>
  );
}

function Scrim({ onClose, children, width = 520 }: { onClose: () => void; children: React.ReactNode; width?: number }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }} style={{ position: "fixed", inset: 0, zIndex: 70, background: "rgba(42,38,32,.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, backdropFilter: "blur(2px)" }}>
      <div className="pop" style={{ background: "var(--surface)", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-pop)", width: `min(${width}px, 100%)`, padding: 26 }}>{children}</div>
    </div>
  );
}

function SuspendModal({ estab, busy, onCancel, onConfirm }: { estab: AdminEstab; busy: boolean; onCancel: () => void; onConfirm: (motivo: string) => void }) {
  const [motivo, setMotivo] = useState("");
  const [attempted, setAttempted] = useState(false);
  const err = !motivo.trim() ? "Escribí el motivo de la suspensión." : motivo.trim().length < 15 ? "El motivo debe tener al menos 15 caracteres." : "";
  const show = attempted && err;
  return (
    <Scrim onClose={onCancel}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
        <span style={{ width: 48, height: 48, borderRadius: "50%", background: "var(--danger-fill)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Ban size={22} color="var(--danger)" /></span>
        <div>
          <h3 style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 20, color: "var(--fg-1)" }}>Suspender establecimiento</h3>
          <div style={{ fontSize: 13.5, color: "var(--fg-2)", marginTop: 2 }}>{estab.nombre} · {estab.titular}</div>
        </div>
      </div>
      <p style={{ margin: "0 0 14px", color: "var(--fg-2)", fontSize: 14.5, lineHeight: 1.55 }}>El establecimiento dejará de aparecer en la exploración y no podrá recibir nuevas reservas. El titular verá el motivo que registres acá.</p>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10, background: "var(--danger-fill)", borderRadius: "var(--radius)", padding: "11px 13px", marginBottom: 18 }}>
        <Clock size={17} color="var(--danger)" style={{ flexShrink: 0, marginTop: 1 }} />
        <p style={{ margin: 0, color: "var(--fg-2)", fontSize: 13.5, lineHeight: 1.5 }}><strong style={{ color: "var(--fg-1)" }}>Duración:</strong> la suspensión no tiene fecha de vencimiento. Se mantiene hasta que un administrador la reactive manualmente.</p>
      </div>
      <label htmlFor="susp-motivo" style={{ display: "block", fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 15.5, color: "var(--fg-1)", marginBottom: 8 }}>Motivo de la suspensión <span style={{ color: "var(--danger)" }}>*</span></label>
      <textarea id="susp-motivo" maxLength={280} rows={4} placeholder="Ej. Reiteradas cancelaciones sin reembolso a los visitantes." value={motivo} onChange={(e) => setMotivo(e.target.value)} autoFocus style={{ width: "100%", resize: "vertical", minHeight: 96, fontFamily: "var(--font-sans)", fontSize: 15, color: "var(--fg-1)", borderRadius: "var(--radius)", background: "var(--surface)", border: "1px solid " + (show ? "var(--danger)" : "var(--sand)"), padding: "12px 14px", outline: "none", boxSizing: "border-box" }} />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginTop: 7 }}>
        {show ? <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, color: "var(--danger-fg)" }}><AlertCircle size={15} color="var(--danger)" /> {err}</span> : <span style={{ fontSize: 12, color: "var(--fg-3)" }}>Quedará registrado junto con tu nombre y la fecha.</span>}
        <span style={{ flexShrink: 0, fontFamily: "var(--font-mono)", fontSize: 12, color: motivo.length > 280 ? "var(--danger)" : "var(--fg-3)" }}>{motivo.length}/280</span>
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 24 }}>
        <button type="button" className="btn btn-neutral" onClick={onCancel} disabled={busy}>Cancelar</button>
        <button type="button" className="btn" onClick={() => { setAttempted(true); if (!err) onConfirm(motivo.trim()); }} disabled={busy} style={{ background: "var(--danger)", color: "#fff", boxShadow: "inset 0 -2px 0 var(--danger-fg)" }}>{busy ? <Loader size={17} className="spin" /> : <Ban size={17} />} Suspender establecimiento</button>
      </div>
    </Scrim>
  );
}

function Inner({ initial }: { initial: AdminEstab[] }) {
  const [estabs, setEstabs] = useState<AdminEstab[]>(initial);
  const [toSuspend, setToSuspend] = useState<AdminEstab | null>(null);
  const [toReactivate, setToReactivate] = useState<AdminEstab | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"todos" | "activos" | "suspendidos">("todos");
  const { suspender, reactivar, isLoading } = useModerarEstablecimiento();

  const activos = estabs.filter((e) => e.estado === "activo").length;
  const suspendidos = estabs.filter((e) => e.estado === "suspendido").length;

  function notify(msg: string) { setFlash(msg); setTimeout(() => setFlash((f) => (f === msg ? null : f)), 3400); }

  const visibles = useMemo(() => {
    const q = query.trim().toLowerCase();
    return estabs.filter((e) => {
      if (filter === "activos" && e.estado !== "activo") return false;
      if (filter === "suspendidos" && e.estado !== "suspendido") return false;
      if (q && !(e.nombre.toLowerCase().includes(q) || e.titular.toLowerCase().includes(q) || e.ubicacion.toLowerCase().includes(q))) return false;
      return true;
    });
  }, [estabs, query, filter]);

  async function confirmSuspend(estab: AdminEstab, motivo: string) {
    await suspender(estab.id, motivo);
    setEstabs((prev) => prev.map((e) => (e.id === estab.id ? { ...e, estado: "suspendido", motivo, suspendido: admNowStamp(), suspendidoPor: "Diego Ferreyra" } : e)));
    setToSuspend(null);
    notify(`Se suspendió ${estab.nombre}.`);
  }
  async function confirmReactivate(estab: AdminEstab) {
    await reactivar(estab.id);
    setEstabs((prev) => prev.map((e) => (e.id === estab.id ? { ...e, estado: "activo", motivo: undefined, suspendido: undefined, suspendidoPor: undefined } : e)));
    setToReactivate(null);
    notify(`Se reactivó ${estab.nombre}.`);
  }

  const filterBtn = (val: typeof filter, label: string) => {
    const on = filter === val;
    return <button type="button" onClick={() => setFilter(val)} style={{ padding: "8px 14px", borderRadius: "var(--radius-pill)", fontSize: 13.5, fontWeight: 600, border: "1px solid " + (on ? "var(--green-800)" : "var(--outline-variant)"), background: on ? "var(--green-800)" : "var(--surface)", color: on ? "#fff" : "var(--fg-2)", cursor: "pointer", whiteSpace: "nowrap" }}>{label}</button>;
  };

  return (
    <div style={{ maxWidth: 1240, margin: "0 auto", padding: "28px 28px 72px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--fg-3)", fontSize: 13.5, marginBottom: 14 }}><span>Plataforma</span><ChevronRight size={15} /><span style={{ color: "var(--fg-2)", fontWeight: 500 }}>Establecimientos</span></div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 32, color: "var(--fg-1)", letterSpacing: "-.01em" }}>Establecimientos</h1>
        <p style={{ margin: "10px 0 0", color: "var(--fg-2)", fontSize: 15.5, lineHeight: 1.5, maxWidth: 680 }}>Supervisá los establecimientos de la plataforma. Podés suspender los que incumplan las normas — siempre con un motivo — y reactivarlos cuando regularicen su situación.</p>
      </div>

      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 20 }}>
        {[{ icon: <Warehouse size={20} color="var(--green-800)" />, label: "Establecimientos activos", value: activos, danger: false }, { icon: <Ban size={20} color={suspendidos > 0 ? "var(--danger)" : "var(--green-800)"} />, label: "Suspendidos", value: suspendidos, danger: suspendidos > 0 }, { icon: <ListIcon size={20} color="var(--green-800)" />, label: "Total en la plataforma", value: estabs.length, danger: false }].map((s) => (
          <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 12, background: "var(--surface)", border: "1px solid var(--outline-variant)", borderRadius: "var(--radius)", padding: "12px 16px", minWidth: 190 }}>
            <span style={{ width: 42, height: 42, borderRadius: 10, background: s.danger ? "var(--danger-fill)" : "var(--green-050)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{s.icon}</span>
            <span><span style={{ display: "block", fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 20, color: "var(--fg-1)" }}>{s.value}</span><span style={{ display: "block", fontSize: 12.5, color: "var(--fg-2)" }}>{s.label}</span></span>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 240 }}>
          <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", display: "flex" }}><Search size={17} color="var(--fg-3)" /></span>
          <input placeholder="Buscar por nombre, titular o ubicación" value={query} onChange={(e) => setQuery(e.target.value)} style={{ width: "100%", fontFamily: "var(--font-sans)", fontSize: 15, color: "var(--fg-1)", borderRadius: "var(--radius)", background: "var(--surface)", border: "1px solid var(--sand)", padding: "11px 14px 11px 42px", outline: "none", boxSizing: "border-box" }} />
        </div>
        <div style={{ display: "flex", gap: 8 }}>{filterBtn("todos", "Todos")}{filterBtn("activos", "Activos")}{filterBtn("suspendidos", "Suspendidos")}</div>
      </div>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {visibles.length === 0 ? (
          <div style={{ padding: "56px 24px", textAlign: "center", color: "var(--fg-3)" }}><SearchX size={32} color="var(--fg-3)" /><div style={{ marginTop: 12, fontSize: 15 }}>No hay establecimientos que coincidan con la búsqueda.</div></div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 1040 }}>
              <thead>
                <tr>{["Establecimiento", "Ubicación", "Actividad", "Alta", "Estado", "Acciones"].map((h, i) => (
                  <th key={h} style={{ textAlign: i === 5 ? "right" : i === 2 ? "center" : "left", fontWeight: 700, color: "var(--fg-2)", fontSize: 12.5, textTransform: "uppercase", letterSpacing: ".05em", padding: "14px 16px", borderBottom: "2px solid var(--outline-variant)", whiteSpace: "nowrap" }}>{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {visibles.map((e) => {
                  const susp = e.estado === "suspendido";
                  return (
                    <Fragment key={e.id}>
                      <tr style={{ borderBottom: susp ? "none" : "1px solid var(--cream-tert)", background: susp ? "var(--danger-fill)" : "transparent" }}>
                        <td style={{ padding: "14px 16px", maxWidth: 320 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                            <span style={{ flexShrink: 0, width: 46, height: 46, borderRadius: 10, display: "inline-flex", alignItems: "center", justifyContent: "center", background: susp ? "var(--cream-tert)" : "var(--green-050)", color: susp ? "var(--fg-3)" : "var(--green-800)", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15, border: "1px solid " + (susp ? "var(--outline-variant)" : "var(--green-300)") }}>{estabInitials(e.nombre)}</span>
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 16, color: "var(--fg-1)" }}>{e.nombre}</div>
                              <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3, fontSize: 12.5, color: "var(--fg-2)" }}><User size={13} color="var(--fg-3)" /> {e.titular}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: "14px 16px" }}><span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13.5, color: "var(--fg-1)" }}><MapPin size={14} color="var(--brown-700)" /> {e.ubicacion}</span></td>
                        <td style={{ padding: "14px 16px", textAlign: "center" }}>
                          <div style={{ display: "inline-flex", alignItems: "center", gap: 14 }}>
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 14, color: "var(--fg-1)" }} title="Actividades publicadas"><Grape size={15} color="var(--green-700)" /> {e.actividades}</span>
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 14, color: "var(--fg-1)" }} title="Reservas históricas"><CalendarCheck size={15} color="var(--brown-700)" /> {e.reservas}</span>
                          </div>
                        </td>
                        <td style={{ padding: "14px 16px", fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--fg-2)" }}>{e.alta}</td>
                        <td style={{ padding: "14px 16px" }}><span style={pill(susp ? "danger" : "success")}>{susp ? "Suspendido" : "Activo"}</span></td>
                        <td style={{ padding: "14px 16px" }}>
                          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                            {susp ? <ActionBtn icon={<RotateCcw size={17} />} label="Reactivar" tone="success" title="Reactivar este establecimiento" onClick={() => setToReactivate(e)} /> : <ActionBtn icon={<Ban size={17} />} label="Suspender" tone="danger" title="Suspender este establecimiento" onClick={() => setToSuspend(e)} />}
                          </div>
                        </td>
                      </tr>
                      {susp && (
                        <tr style={{ borderBottom: "1px solid var(--cream-tert)", background: "var(--danger-fill)" }}>
                          <td colSpan={6} style={{ padding: "0 16px 14px 72px" }}>
                            <div style={{ display: "flex", alignItems: "flex-start", gap: 10, background: "var(--surface)", border: "1px solid var(--danger)", borderRadius: "var(--radius)", padding: "10px 13px" }}>
                              <AlertTriangle size={16} color="var(--danger)" style={{ flexShrink: 0, marginTop: 2 }} />
                              <div style={{ minWidth: 0 }}>
                                <div className="t-label" style={{ color: "var(--danger-fg)", marginBottom: 4 }}>Motivo de la suspensión</div>
                                <div style={{ fontSize: 13.5, color: "var(--fg-1)", lineHeight: 1.5 }}>{e.motivo}</div>
                                <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6, fontSize: 11.5, color: "var(--fg-3)" }}><Clock size={12} color="var(--fg-3)" /> Suspendido el {e.suspendido}{e.suspendidoPor ? ` · por ${e.suspendidoPor}` : ""}</div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {toSuspend && <SuspendModal estab={toSuspend} busy={isLoading} onCancel={() => setToSuspend(null)} onConfirm={(motivo) => confirmSuspend(toSuspend, motivo)} />}
      {toReactivate && (
        <Scrim onClose={() => setToReactivate(null)} width={460}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
            <span style={{ width: 48, height: 48, borderRadius: "50%", background: "var(--green-050)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><RotateCcw size={22} color="var(--green-800)" /></span>
            <h3 style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 20, color: "var(--fg-1)" }}>Reactivar establecimiento</h3>
          </div>
          <p style={{ margin: "0 0 22px", color: "var(--fg-2)", fontSize: 15, lineHeight: 1.55 }}><strong style={{ color: "var(--fg-1)" }}>{toReactivate.nombre}</strong> volverá a aparecer en la exploración y podrá recibir reservas nuevamente.</p>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
            <button type="button" className="btn btn-neutral" onClick={() => setToReactivate(null)} disabled={isLoading}>No, volver</button>
            <button type="button" className="btn btn-primary" onClick={() => confirmReactivate(toReactivate)} disabled={isLoading}>{isLoading ? <Loader size={17} className="spin" /> : <Check size={17} />} Sí, reactivar</button>
          </div>
        </Scrim>
      )}
      {flash && <div className="pop" style={{ position: "fixed", right: 24, bottom: 24, zIndex: 80, background: "var(--green-800)", color: "#fff", borderRadius: "var(--radius)", padding: "14px 20px", display: "flex", alignItems: "center", gap: 10, boxShadow: "var(--shadow-pop)", fontSize: 15, fontWeight: 500, maxWidth: "calc(100vw - 40px)" }}><CheckCircle2 size={20} color="#fff" /> {flash}</div>}
    </div>
  );
}

export default function EstablecimientosAdminClient() {
  const { data, isLoading, error, reload } = useEstablecimientosAdmin();
  return (
    <AsyncBoundary loading={isLoading} error={error} onRetry={reload} loadingLabel="Cargando establecimientos…">
      {data && <Inner initial={data} />}
    </AsyncBoundary>
  );
}
