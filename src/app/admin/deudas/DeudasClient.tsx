"use client";

import { useMemo, useState } from "react";
import {
  ChevronRight, Search, Landmark, AlertCircle, Handshake, CheckCircle2, CircleDashed,
  ListTree, HandCoins, ArrowLeft, Hash, History, Calendar, ArrowRight, Receipt, ArrowRightCircle,
  SearchX, Loader,
} from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import { estabInitials } from "@/data/admin";
import { moneyAr, fmtFecha, fmtFechaHora } from "@/lib/format";
import { DEUDA_ESTADO_META, DEUDA_ESTADOS_ORDEN, deudaAccionable } from "@/data/deudas";
import { useDeudas } from "@/hooks/useDeudas";
import type { Deuda, EstadoDeuda, HistorialDeuda } from "@/types/deudas";

const TONE: Record<string, { bg: string; fg: string; solid: string }> = {
  danger: { bg: "var(--danger-fill)", fg: "var(--danger-fg)", solid: "var(--danger)" },
  warning: { bg: "var(--warning-fill)", fg: "var(--warning-fg)", solid: "var(--warning)" },
  success: { bg: "var(--success-fill)", fg: "var(--success-fg)", solid: "var(--success)" },
  info: { bg: "var(--info-fill)", fg: "var(--info-fg)", solid: "var(--info)" },
};

const ESTADO_ICON: Record<EstadoDeuda, React.ComponentType<{ size?: number; color?: string }>> = {
  sin_devolver: AlertCircle, parcial: CircleDashed, total: CheckCircle2, acuerdo: Handshake,
};

function DeudaPill({ estado }: { estado: EstadoDeuda }) {
  const m = DEUDA_ESTADO_META[estado];
  const t = TONE[m.tone];
  const Icon = ESTADO_ICON[estado];
  return <span style={{ display: "inline-flex", alignItems: "center", gap: 6, borderRadius: "var(--radius-pill)", padding: "4px 11px", fontSize: 12.5, fontWeight: 700, background: t.bg, color: t.fg, whiteSpace: "nowrap" }}><Icon size={13} color={t.fg} /> {m.label}</span>;
}

function Progreso({ devuelto, total }: { devuelto: number; total: number }) {
  const pct = total > 0 ? Math.min(100, Math.round((devuelto / total) * 100)) : 0;
  const full = pct >= 100;
  return (
    <div style={{ minWidth: 120 }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8, marginBottom: 5 }}>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 13.5, fontWeight: 600, color: full ? "var(--success-fg)" : "var(--fg-1)" }}>{moneyAr(devuelto)}</span>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 11.5, color: "var(--fg-3)" }}>{pct}%</span>
      </div>
      <div style={{ height: 6, borderRadius: 999, background: "var(--cream-tert)", overflow: "hidden" }}>
        <div style={{ width: pct + "%", height: "100%", background: full ? "var(--success)" : "var(--brown-700)" }} />
      </div>
    </div>
  );
}

/* ---- Lista ------------------------------------------------------------- */
function List({ deudas, onDetalle, onAccion }: { deudas: Deuda[]; onDetalle: (id: string) => void; onAccion: (d: Deuda, tipo: "pago" | "acuerdo") => void }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"todos" | EstadoDeuda>("todos");

  const counts = useMemo(() => {
    const c: Record<string, number> = { todos: deudas.length };
    DEUDA_ESTADOS_ORDEN.forEach((e) => { c[e] = deudas.filter((d) => d.estado === e).length; });
    return c;
  }, [deudas]);
  const totalAdeudado = useMemo(() => deudas.filter((d) => d.estado !== "total").reduce((s, d) => s + (d.montoTotal - d.montoDevuelto), 0), [deudas]);

  const visibles = useMemo(() => {
    const q = query.trim().toLowerCase();
    return deudas.filter((d) => {
      if (filter !== "todos" && d.estado !== filter) return false;
      if (q && !(d.id.toLowerCase().includes(q) || d.deudor.toLowerCase().includes(q))) return false;
      return true;
    });
  }, [deudas, query, filter]);

  const kpis = [
    { icon: <Landmark size={20} color="var(--danger-fg)" />, label: "Total adeudado", value: moneyAr(totalAdeudado), bg: "var(--danger-fill)" },
    { icon: <AlertCircle size={20} color="var(--danger-fg)" />, label: "Sin devolver", value: counts.sin_devolver, bg: "var(--danger-fill)" },
    { icon: <Handshake size={20} color="var(--info-fg)" />, label: "Con acuerdo", value: counts.acuerdo, bg: "var(--info-fill)" },
    { icon: <CheckCircle2 size={20} color="var(--success-fg)" />, label: "Saldadas", value: counts.total, bg: "var(--success-fill)" },
  ];

  const filterBtn = (val: "todos" | EstadoDeuda, label: string, n: number) => {
    const on = filter === val;
    return (
      <button key={val} type="button" onClick={() => setFilter(val)} style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "9px 14px", borderRadius: "var(--radius-pill)", fontSize: 13.5, fontWeight: 600, border: "1px solid " + (on ? "var(--green-800)" : "var(--outline-variant)"), background: on ? "var(--green-800)" : "var(--surface)", color: on ? "#fff" : "var(--fg-2)", cursor: "pointer", whiteSpace: "nowrap" }}>
        {label}<span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 12, padding: "1px 7px", borderRadius: 999, background: on ? "rgba(255,255,255,.22)" : "var(--cream-tert)", color: on ? "#fff" : "var(--fg-2)" }}>{n}</span>
      </button>
    );
  };

  const thStyle: React.CSSProperties = { fontWeight: 600, color: "var(--fg-2)", fontSize: 11, textTransform: "uppercase", letterSpacing: ".06em", padding: "13px 18px", borderBottom: "1px solid var(--outline-variant)", whiteSpace: "nowrap" };

  return (
    <div style={{ maxWidth: 1240, margin: "0 auto", padding: "28px 28px 80px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--fg-3)", fontSize: 13.5, marginBottom: 14 }}><span>Deudas y reembolsos</span><ChevronRight size={15} /><span style={{ color: "var(--fg-2)", fontWeight: 500 }}>Deudas de productores</span></div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 32, color: "var(--fg-1)", letterSpacing: "-.01em" }}>Deudas de productores</h1>
        <p style={{ margin: "10px 0 0", color: "var(--fg-2)", fontSize: 15.5, lineHeight: 1.5, maxWidth: 720 }}>Deudas que las fincas tienen con la plataforma por reembolsos que el sistema cubrió. Registrá los pagos a medida que las fincas devuelven el dinero y pactá acuerdos de pago cuando haga falta.</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginBottom: 26 }}>
        {kpis.map((k) => (
          <div key={k.label} style={{ background: "var(--surface)", border: "1px solid var(--outline-variant)", borderRadius: "var(--radius)", padding: "16px 20px", display: "flex", alignItems: "center", gap: 14 }}>
            <span style={{ width: 44, height: 44, borderRadius: 11, background: k.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{k.icon}</span>
            <div style={{ minWidth: 0 }}><div className="t-label" style={{ marginBottom: 4 }}>{k.label}</div><div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 22, color: "var(--fg-1)", lineHeight: 1.05 }}>{k.value}</div></div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 240 }}>
          <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", display: "flex" }}><Search size={17} color="var(--fg-3)" /></span>
          <input placeholder="Buscar por ID de deuda o establecimiento deudor" value={query} onChange={(e) => setQuery(e.target.value)} style={{ width: "100%", fontFamily: "var(--font-sans)", fontSize: 15, color: "var(--fg-1)", borderRadius: "var(--radius)", background: "var(--surface)", border: "1px solid var(--sand)", padding: "11px 14px 11px 42px", outline: "none", boxSizing: "border-box" }} />
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>{filterBtn("todos", "Todos", counts.todos)}{DEUDA_ESTADOS_ORDEN.map((e) => filterBtn(e, DEUDA_ESTADO_META[e].label, counts[e]))}</div>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {visibles.length === 0 ? (
          <div style={{ padding: "56px 24px", textAlign: "center", color: "var(--fg-3)" }}><SearchX size={32} color="var(--fg-3)" /><div style={{ marginTop: 12, fontSize: 15 }}>No hay deudas que coincidan con la búsqueda.</div></div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 1040 }}>
              <thead>
                <tr style={{ background: "var(--cream-tert)" }}>
                  {["Id de deuda", "Establecimiento deudor", "Monto total", "Monto devuelto", "Estado", "Acciones"].map((h, i) => (
                    <th key={i} style={{ ...thStyle, textAlign: i === 2 || i === 5 ? "right" : "left" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visibles.map((d) => {
                  const acc = deudaAccionable(d.estado);
                  return (
                    <tr key={d.id} style={{ borderBottom: "1px solid var(--cream-tert)" }}>
                      <td style={{ padding: "16px 18px", fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 13.5, color: "var(--fg-1)" }}>{d.id}</td>
                      <td style={{ padding: "16px 18px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
                          <span style={{ flexShrink: 0, width: 38, height: 38, borderRadius: 9, background: "var(--green-050)", color: "var(--green-800)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 13 }}>{estabInitials(d.deudor)}</span>
                          <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 15, color: "var(--fg-1)" }}>{d.deudor}</span>
                        </div>
                      </td>
                      <td style={{ padding: "16px 18px", textAlign: "right", fontFamily: "var(--font-mono)", fontWeight: 600, fontSize: 14.5, color: "var(--fg-1)" }}>{moneyAr(d.montoTotal)}</td>
                      <td style={{ padding: "16px 18px" }}><Progreso devuelto={d.montoDevuelto} total={d.montoTotal} /></td>
                      <td style={{ padding: "16px 18px" }}><DeudaPill estado={d.estado} /></td>
                      <td style={{ padding: "16px 18px" }}>
                        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", flexWrap: "wrap" }}>
                          <button type="button" className="btn btn-neutral btn-sm" onClick={() => onDetalle(d.id)}><ListTree size={15} /> Detalle</button>
                          <button type="button" className="btn btn-primary btn-sm" disabled={!acc} title={acc ? undefined : "Solo se registran pagos en deudas sin devolver o parciales."} onClick={() => onAccion(d, "pago")}><HandCoins size={15} /> Agregar pago</button>
                          <button type="button" className="btn btn-neutral btn-sm" disabled={!acc} title={acc ? undefined : "Solo se pactan acuerdos en deudas sin devolver o parciales."} onClick={() => onAccion(d, "acuerdo")}><Handshake size={15} /> Acuerdo</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---- Detalle ----------------------------------------------------------- */
function TimelineItem({ h, isLast }: { h: HistorialDeuda; isLast: boolean }) {
  const m = DEUDA_ESTADO_META[h.estado];
  const dot = TONE[m.tone].solid;
  const Icon = ESTADO_ICON[h.estado];
  const isCurrent = h.hasta === null;
  return (
    <div style={{ display: "flex", gap: 16 }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
        <span style={{ width: 30, height: 30, borderRadius: "50%", background: "var(--surface)", border: `2px solid ${dot}`, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1 }}><Icon size={15} color={dot} /></span>
        {!isLast && <span style={{ width: 2, flex: 1, background: "var(--outline-variant)", marginTop: 2, marginBottom: 2, minHeight: 24 }} />}
      </div>
      <div style={{ paddingBottom: isLast ? 0 : 22, minWidth: 0, flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <DeudaPill estado={h.estado} />
          {isCurrent && <span style={{ fontSize: 11.5, fontWeight: 700, color: "var(--green-800)", background: "var(--green-050)", border: "1px solid var(--green-100)", borderRadius: "var(--radius-pill)", padding: "2px 9px" }}>Estado actual</span>}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8, fontFamily: "var(--font-mono)", fontSize: 12.5, color: "var(--fg-2)" }}>
          <Calendar size={13} color="var(--fg-3)" /> {fmtFecha(h.desde)} <ArrowRight size={12} color="var(--fg-3)" /> {h.hasta ? fmtFecha(h.hasta) : <span style={{ color: "var(--green-800)", fontWeight: 600 }}>En curso</span>}
        </div>
        <p style={{ margin: "9px 0 0", fontSize: 14, color: "var(--fg-1)", lineHeight: 1.5 }}>{h.motivo}</p>
        {h.pago && (
          <div style={{ marginTop: 12, background: "var(--cream-tert)", border: "1px solid var(--outline-variant)", borderRadius: "var(--radius)", padding: "12px 14px" }}>
            <div className="t-label" style={{ marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}><Receipt size={13} color="var(--fg-3)" /> Pago registrado</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 14 }}>
              <div><div style={{ fontSize: 11, color: "var(--fg-3)", marginBottom: 3 }}>Id de pago</div><div style={{ fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 600, color: "var(--fg-1)" }}>{h.pago.pagoId}</div></div>
              <div><div style={{ fontSize: 11, color: "var(--fg-3)", marginBottom: 3 }}>Fecha de pago</div><div style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--fg-1)" }}>{fmtFechaHora(h.pago.fecha)}</div></div>
              <div><div style={{ fontSize: 11, color: "var(--fg-3)", marginBottom: 3 }}>Monto de pago</div><div style={{ fontFamily: "var(--font-mono)", fontSize: 13.5, fontWeight: 700, color: "var(--success-fg)" }}>{moneyAr(h.pago.monto)}</div></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Detalle({ deuda, onBack, onAccion }: { deuda: Deuda; onBack: () => void; onAccion: (d: Deuda, tipo: "pago" | "acuerdo") => void }) {
  const acc = deudaAccionable(deuda.estado);
  const pendiente = deuda.montoTotal - deuda.montoDevuelto;
  return (
    <div style={{ maxWidth: 980, margin: "0 auto", padding: "24px 28px 96px" }}>
      <button type="button" onClick={onBack} style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "transparent", border: "none", cursor: "pointer", color: "var(--green-800)", fontSize: 13.5, fontWeight: 600, marginBottom: 14, padding: 0 }}><ArrowLeft size={16} color="var(--green-800)" /> Volver a deudas</button>

      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 22 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, minWidth: 0 }}>
          <span style={{ flexShrink: 0, width: 54, height: 54, borderRadius: 12, background: "var(--green-050)", color: "var(--green-800)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 17 }}>{estabInitials(deuda.deudor)}</span>
          <div style={{ minWidth: 0 }}>
            <h1 style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 26, color: "var(--fg-1)", letterSpacing: "-.01em", lineHeight: 1.2 }}>{deuda.deudor}</h1>
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginTop: 9, fontSize: 13.5, color: "var(--fg-2)" }}><span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Hash size={14} color="var(--fg-3)" /><span style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>{deuda.id}</span></span><DeudaPill estado={deuda.estado} /></div>
          </div>
        </div>
        {acc && (
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button type="button" className="btn btn-primary" onClick={() => onAccion(deuda, "pago")}><HandCoins size={16} /> Agregar pago</button>
            <button type="button" className="btn btn-neutral" onClick={() => onAccion(deuda, "acuerdo")}><Handshake size={16} /> Acuerdo de pago</button>
          </div>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 16, marginBottom: 28 }}>
        {[
          { label: "Monto total de la deuda", value: moneyAr(deuda.montoTotal), color: "var(--fg-1)" },
          { label: "Monto devuelto", value: moneyAr(deuda.montoDevuelto), color: "var(--success-fg)" },
          { label: "Saldo pendiente", value: moneyAr(pendiente), color: pendiente > 0 ? "var(--danger-fg)" : "var(--success-fg)" },
        ].map((m) => (
          <div key={m.label} style={{ background: "var(--surface)", border: "1px solid var(--outline-variant)", borderRadius: "var(--radius)", padding: "16px 20px" }}>
            <div className="t-label" style={{ marginBottom: 6 }}>{m.label}</div><div style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 22, color: m.color }}>{m.value}</div>
          </div>
        ))}
      </div>

      <section style={{ background: "var(--surface)", border: "1px solid var(--outline-variant)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
        <header style={{ display: "flex", alignItems: "center", gap: 11, padding: "18px 24px", borderBottom: "1px solid var(--cream-tert)" }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: "var(--green-050)", display: "flex", alignItems: "center", justifyContent: "center" }}><History size={16} color="var(--green-800)" /></div>
          <div><h2 style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 18, color: "var(--fg-1)" }}>Historial de la deuda</h2><div style={{ fontSize: 12.5, color: "var(--fg-3)", marginTop: 2 }}>Estados por los que pasó la deuda, en orden cronológico.</div></div>
        </header>
        <div style={{ padding: 24 }}>
          {deuda.historial.map((h, i) => <TimelineItem key={i} h={h} isLast={i === deuda.historial.length - 1} />)}
        </div>
      </section>
    </div>
  );
}

function Inner({ initial }: { initial: Deuda[] }) {
  const [deudas] = useState<Deuda[]>(initial);
  const [selId, setSelId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const sel = deudas.find((d) => d.id === selId) || null;

  function notify(msg: string) { setToast(msg); setTimeout(() => setToast((t) => (t === msg ? null : t)), 3600); }
  const onAccion = (d: Deuda, tipo: "pago" | "acuerdo") => notify(tipo === "pago" ? `Agregar pago de la deuda ${d.id} (próximamente).` : `Acuerdo de pago de la deuda ${d.id} (próximamente).`);

  return (
    <>
      {sel ? <Detalle deuda={sel} onBack={() => { setSelId(null); window.scrollTo({ top: 0 }); }} onAccion={onAccion} /> : <List deudas={deudas} onDetalle={(id) => { setSelId(id); window.scrollTo({ top: 0 }); }} onAccion={onAccion} />}
      {toast && <div className="pop" style={{ position: "fixed", right: 24, bottom: 24, zIndex: 90, maxWidth: 400, background: "var(--green-800)", color: "#fff", borderRadius: "var(--radius)", padding: "14px 18px", display: "flex", alignItems: "center", gap: 11, fontWeight: 500, fontSize: 14.5, boxShadow: "var(--shadow-pop)" }}><ArrowRightCircle size={19} color="#fff" /> {toast}</div>}
    </>
  );
}

export default function DeudasClient() {
  const { data, isLoading } = useDeudas();
  return (
    <AdminShell active="deudas">
      {isLoading || !data ? (
        <div style={{ padding: "120px 28px", textAlign: "center", color: "var(--fg-3)" }}><Loader size={26} className="spin" /><div style={{ marginTop: 12, fontSize: 14 }}>Cargando deudas…</div></div>
      ) : (
        <Inner initial={data} />
      )}
    </AdminShell>
  );
}
