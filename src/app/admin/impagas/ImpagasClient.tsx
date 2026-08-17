"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronRight, AlertCircle, Clock, Landmark, Search, X, Warehouse, HandCoins, ReceiptText,
  Banknote, Hash, CalendarClock, User, SearchX, ArrowRightCircle, Loader,
} from "lucide-react";
import AsyncBoundary from "@/components/AsyncBoundary";
import { moneyAr, fmtFechaHora } from "@/lib/format";
import { genId } from "@/lib/id";
import { ESTADO_META, COMISION_SISTEMA, vencimiento, estaVencido } from "@/data/impagas";
import { useImpagas, useReembolsar } from "@/hooks/useImpagas";
import type { EstadoReembolso, Reembolso, ReembolsoForm } from "@/types/impagas";

const TONE: Record<string, { bg: string; fg: string }> = {
  danger: { bg: "var(--danger-fill)", fg: "var(--danger-fg)" },
  warning: { bg: "var(--warning-fill)", fg: "var(--warning-fg)" },
  success: { bg: "var(--success-fill)", fg: "var(--success-fg)" },
  info: { bg: "var(--info-fill)", fg: "var(--info-fg)" },
};

function EstadoPill({ estado }: { estado: EstadoReembolso }) {
  const m = ESTADO_META[estado];
  const t = TONE[m.tone];
  return <span style={{ display: "inline-flex", alignItems: "center", borderRadius: "var(--radius-pill)", padding: "4px 11px", fontSize: 12.5, fontWeight: 700, background: t.bg, color: t.fg, whiteSpace: "nowrap" }}>{m.label}</span>;
}

function Kpi({ label, value, sub, icon, tone }: { label: string; value: string | number; sub: string; icon: React.ReactNode; tone: "danger" | "warning" | "info" }) {
  const t = TONE[tone];
  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--outline-variant)", borderRadius: "var(--radius)", padding: "18px 22px", display: "flex", alignItems: "center", gap: 16 }}>
      <div style={{ width: 44, height: 44, borderRadius: 11, background: t.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{icon}</div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div className="t-label" style={{ marginBottom: 4 }}>{label}</div>
        <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 26, color: "var(--fg-1)", lineHeight: 1.05 }}>{value}</div>
        <div style={{ fontSize: 12.5, color: "var(--fg-3)", marginTop: 3 }}>{sub}</div>
      </div>
    </div>
  );
}

function Scrim({ onClose, children, width = 500 }: { onClose: () => void; children: React.ReactNode; width?: number }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }} style={{ position: "fixed", inset: 0, zIndex: 70, background: "rgba(42,38,32,.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, backdropFilter: "blur(2px)" }}>
      <div className="pop" style={{ background: "var(--surface)", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-pop)", width: `min(${width}px, 100%)`, maxHeight: "92vh", overflow: "auto" }}>{children}</div>
    </div>
  );
}

const inputStyle: React.CSSProperties = { width: "100%", fontFamily: "var(--font-mono)", fontSize: 15, color: "var(--fg-1)", borderRadius: "var(--radius)", background: "var(--surface)", border: "1px solid var(--sand)", padding: "12px 14px", outline: "none", boxSizing: "border-box" };

function ReembolsarModal({ refund, busy, onClose, onSubmit }: { refund: Reembolso; busy: boolean; onClose: () => void; onSubmit: (form: ReembolsoForm) => void }) {
  const [monto, setMonto] = useState(String(refund.monto));
  const [fecha, setFecha] = useState(() => { const n = new Date(); return new Date(n.getTime() - n.getTimezoneOffset() * 60000).toISOString().slice(0, 16); });
  const [pagoId, setPagoId] = useState("");
  const [touched, setTouched] = useState(false);

  const montoNum = parseFloat(monto);
  const errMonto = !monto || isNaN(montoNum) || montoNum <= 0;
  const errFecha = !fecha;
  const errPago = !pagoId.trim();
  const invalid = errMonto || errFecha || errPago;
  const montoDeuda = Math.round((isNaN(montoNum) ? 0 : montoNum) * (1 - COMISION_SISTEMA));
  const comision = (isNaN(montoNum) ? 0 : montoNum) - montoDeuda;
  const lbl: React.CSSProperties = { display: "block", marginBottom: 7 };
  const err: React.CSSProperties = { color: "var(--danger-fg)", fontSize: 12.5, marginTop: 6, display: "flex", alignItems: "center", gap: 5 };

  return (
    <Scrim onClose={onClose}>
      <header style={{ padding: "22px 26px 16px", borderBottom: "1px solid var(--cream-tert)", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
        <div>
          <div className="t-label" style={{ marginBottom: 6 }}>Cargar transferencia de reembolso</div>
          <h2 style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 22, color: "var(--fg-1)" }}>Reembolsar al visitante</h2>
          <div style={{ marginTop: 8, fontSize: 13.5, color: "var(--fg-2)" }}><span style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>{refund.id}</span> · {refund.visitante} · {refund.finca}</div>
        </div>
        <button type="button" onClick={onClose} aria-label="Cerrar" style={{ width: 36, height: 36, flexShrink: 0, border: "1px solid var(--outline-variant)", background: "var(--surface)", borderRadius: "var(--radius)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><X size={18} color="var(--fg-2)" /></button>
      </header>
      <div style={{ padding: "20px 26px 6px" }}>
        <div style={{ marginBottom: 20 }}>
          <label className="t-label" style={lbl}>Monto pagado</label>
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--fg-3)", fontFamily: "var(--font-mono)", fontSize: 15, pointerEvents: "none" }}>$</span>
            <input type="number" min="0" step="1" value={monto} onChange={(e) => setMonto(e.target.value)} style={{ ...inputStyle, paddingLeft: 28, borderColor: touched && errMonto ? "var(--danger)" : "var(--sand)" }} />
          </div>
          {touched && errMonto && <div style={err}><AlertCircle size={14} color="var(--danger)" /> Ingresá un monto válido mayor a cero.</div>}
        </div>
        <div style={{ marginBottom: 20 }}>
          <label className="t-label" style={lbl}>Fecha y hora de la transferencia</label>
          <input type="datetime-local" value={fecha} onChange={(e) => setFecha(e.target.value)} style={{ ...inputStyle, borderColor: touched && errFecha ? "var(--danger)" : "var(--sand)" }} />
          {touched && errFecha && <div style={err}><AlertCircle size={14} color="var(--danger)" /> Indicá la fecha y hora de la transferencia.</div>}
        </div>
        <div style={{ marginBottom: 18 }}>
          <label className="t-label" style={lbl}>ID de pago del servicio de pagos</label>
          <input placeholder="Ej. PSP-7XQ2-90431" value={pagoId} onChange={(e) => setPagoId(e.target.value)} style={{ ...inputStyle, borderColor: touched && errPago ? "var(--danger)" : "var(--sand)" }} />
          {touched && errPago && <div style={err}><AlertCircle size={14} color="var(--danger)" /> Pegá el ID de pago devuelto por el servicio de pagos.</div>}
        </div>
        <div style={{ background: "var(--info-fill)", border: "1px solid var(--info)", borderRadius: "var(--radius)", padding: "14px 16px", display: "flex", gap: 12 }}>
          <Landmark size={18} color="var(--info-fg)" style={{ flexShrink: 0, marginTop: 1 }} />
          <div style={{ fontSize: 13, color: "var(--fg-2)", lineHeight: 1.5 }}>Al confirmar, el reembolso pasa a <strong style={{ color: "var(--fg-1)" }}>Reembolso sistema</strong> y se genera una deuda de <strong style={{ color: "var(--fg-1)" }}>{refund.finca}</strong> por <strong style={{ color: "var(--fg-1)", fontFamily: "var(--font-mono)" }}>{moneyAr(montoDeuda)}</strong> <span style={{ color: "var(--fg-3)" }}>(monto − {Math.round(COMISION_SISTEMA * 100)}% de comisión = {moneyAr(comision)}).</span></div>
        </div>
      </div>
      <footer style={{ padding: "16px 26px", borderTop: "1px solid var(--cream-tert)", background: "var(--cream-tert)", display: "flex", justifyContent: "flex-end", gap: 12 }}>
        <button type="button" className="btn btn-neutral" onClick={onClose} disabled={busy}>Cancelar</button>
        <button type="button" className="btn btn-primary" onClick={() => { setTouched(true); if (!invalid) onSubmit({ monto: montoNum, fecha, pagoId: pagoId.trim() }); }} disabled={busy}>{busy ? <Loader size={17} className="spin" /> : <HandCoins size={17} />} Agregar reembolso</button>
      </footer>
    </Scrim>
  );
}

function PagoModal({ refund, onClose }: { refund: Reembolso; onClose: () => void }) {
  const p = refund.pago!;
  const rows = [
    { icon: <Hash size={17} color="var(--fg-2)" />, label: "Id del pago (servicio de pagos)", value: p.pagoId, mono: true },
    { icon: <CalendarClock size={17} color="var(--fg-2)" />, label: "Fecha y hora del pago", value: fmtFechaHora(p.fecha), mono: true },
    { icon: <User size={17} color="var(--fg-2)" />, label: "Visitante pagado", value: p.visitante, mono: false },
  ];
  return (
    <Scrim onClose={onClose} width={480}>
      <header style={{ padding: "22px 26px 16px", borderBottom: "1px solid var(--cream-tert)", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
        <div>
          <div className="t-label" style={{ marginBottom: 6 }}>Detalle del pago del reembolso</div>
          <h2 style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 22, color: "var(--fg-1)" }}>Reembolso pagado por el sistema</h2>
          <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8 }}><span style={{ fontFamily: "var(--font-mono)", fontSize: 12.5, color: "var(--fg-2)", fontWeight: 600 }}>{refund.id}</span><EstadoPill estado={refund.estado} /></div>
        </div>
        <button type="button" onClick={onClose} aria-label="Cerrar" style={{ width: 36, height: 36, flexShrink: 0, border: "1px solid var(--outline-variant)", background: "var(--surface)", borderRadius: "var(--radius)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><X size={18} color="var(--fg-2)" /></button>
      </header>
      <div style={{ padding: "8px 26px 6px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 0", borderBottom: "1px dashed var(--cream-tert)" }}>
          <span style={{ width: 44, height: 44, borderRadius: 11, background: "var(--info-fill)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Banknote size={21} color="var(--info-fg)" /></span>
          <div><div className="t-label" style={{ marginBottom: 4 }}>Monto pagado</div><div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 28, color: "var(--fg-1)", lineHeight: 1 }}>{moneyAr(p.monto)}</div></div>
        </div>
        {rows.map((row) => (
          <div key={row.label} style={{ display: "flex", alignItems: "center", gap: 13, padding: "14px 0", borderBottom: "1px dashed var(--cream-tert)" }}>
            <span style={{ width: 36, height: 36, borderRadius: 9, flexShrink: 0, background: "var(--cream-tert)", display: "flex", alignItems: "center", justifyContent: "center" }}>{row.icon}</span>
            <div style={{ minWidth: 0 }}><div className="t-label" style={{ marginBottom: 3 }}>{row.label}</div><div style={{ fontSize: 14.5, color: "var(--fg-1)", fontFamily: row.mono ? "var(--font-mono)" : "var(--font-sans)", fontWeight: 500, wordBreak: "break-word" }}>{row.value}</div></div>
          </div>
        ))}
      </div>
      <footer style={{ padding: "16px 26px", borderTop: "1px solid var(--cream-tert)", background: "var(--cream-tert)", display: "flex", justifyContent: "flex-end", gap: 12 }}>
        <button type="button" className="btn btn-primary" onClick={onClose}>Cerrar</button>
      </footer>
    </Scrim>
  );
}

const FILTERS: { id: "todos" | EstadoReembolso; label: string }[] = [
  { id: "todos", label: "Todos" }, { id: "impago", label: "Impago" }, { id: "pedido", label: "Pedido" }, { id: "reembolsado", label: "Reembolsado" }, { id: "sistema", label: "Reembolso sistema" },
];

function Inner({ initial }: { initial: Reembolso[] }) {
  const router = useRouter();
  const [items, setItems] = useState<Reembolso[]>(initial);
  const [filter, setFilter] = useState<"todos" | EstadoReembolso>("impago");
  const [query, setQuery] = useState("");
  const [detalle, setDetalle] = useState<Reembolso | null>(null);
  const [reembolsar, setReembolsar] = useState<Reembolso | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const { reembolsar: doReembolsar, isLoading } = useReembolsar();

  const counts = useMemo(() => ({
    todos: items.length,
    impago: items.filter((r) => r.estado === "impago").length,
    pedido: items.filter((r) => r.estado === "pedido").length,
    reembolsado: items.filter((r) => r.estado === "reembolsado").length,
    sistema: items.filter((r) => r.estado === "sistema").length,
  }), [items]);
  const totalImpago = useMemo(() => items.filter((r) => r.estado === "impago").reduce((s, r) => s + r.monto, 0), [items]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((r) => {
      if (filter !== "todos" && r.estado !== filter) return false;
      if (!q) return true;
      return [r.id, r.visitante, r.finca, r.actividad, r.deudaId].filter(Boolean).join(" ").toLowerCase().includes(q);
    });
  }, [items, filter, query]);

  function notify(msg: string) { setToast(msg); setTimeout(() => setToast((t) => (t === msg ? null : t)), 3400); }

  async function confirmarReembolso(refund: Reembolso, form: ReembolsoForm) {
    await doReembolsar(refund.id, form);
    const montoDeuda = Math.round(form.monto * (1 - COMISION_SISTEMA));
    const deudaId = genId("DEU").toUpperCase();
    setItems((prev) => prev.map((r) => (r.id !== refund.id ? r : { ...r, estado: "sistema", fechaReembolso: form.fecha, deudaId, pago: { pagoId: form.pagoId, fecha: form.fecha, monto: form.monto, visitante: r.visitante } })));
    setReembolsar(null);
    notify(`Reembolso ${refund.id} cargado. Se creó la deuda ${deudaId} de ${refund.finca} por ${moneyAr(montoDeuda)}.`);
  }

  const thStyle: React.CSSProperties = { textAlign: "left", padding: "13px 16px", fontSize: 11, fontWeight: 600, letterSpacing: ".06em", textTransform: "uppercase", color: "var(--fg-2)", borderBottom: "1px solid var(--outline-variant)", whiteSpace: "nowrap" };

  return (
    <div style={{ maxWidth: 1280, margin: "0 auto", padding: "28px 28px 80px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--fg-3)", fontSize: 13.5, marginBottom: 14 }}><span>Deudas y reembolsos</span><ChevronRight size={15} /><span style={{ color: "var(--fg-2)", fontWeight: 500 }}>Reservas impagas</span></div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 32, color: "var(--fg-1)", letterSpacing: "-.01em" }}>Reservas impagas</h1>
        <p style={{ margin: "10px 0 0", color: "var(--fg-2)", fontSize: 15.5, lineHeight: 1.5, maxWidth: 680 }}>Reembolsos que los productores deben a los visitantes. Reembolsá los pagos impagos y revisá las deudas que el sistema cubrió por cuenta de las fincas.</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16, marginBottom: 26 }}>
        <Kpi label="Total reembolsos impagos" value={moneyAr(totalImpago)} sub={`${counts.impago} reserva${counts.impago === 1 ? "" : "s"} sin reembolsar`} icon={<AlertCircle size={21} color="var(--danger-fg)" />} tone="danger" />
        <Kpi label="En proceso (pedido)" value={counts.pedido} sub="Solicitados al servicio de pagos" icon={<Clock size={21} color="var(--warning-fg)" />} tone="warning" />
        <Kpi label="Cubiertos por el sistema" value={counts.sistema} sub="Generan deuda del productor" icon={<Landmark size={21} color="var(--info-fg)" />} tone="info" />
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, gap: 16, flexWrap: "wrap" }}>
        <div style={{ display: "inline-flex", flexWrap: "wrap", background: "var(--surface)", border: "1px solid var(--outline-variant)", borderRadius: "var(--radius)", padding: 4, gap: 2 }}>
          {FILTERS.map((o) => {
            const on = filter === o.id;
            return (
              <button key={o.id} onClick={() => setFilter(o.id)} style={{ padding: "8px 14px", border: "none", background: on ? "var(--green-800)" : "transparent", color: on ? "#fff" : "var(--fg-2)", borderRadius: "calc(var(--radius) - 2px)", fontSize: 13.5, fontWeight: on ? 600 : 500, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, whiteSpace: "nowrap" }}>
                {o.label}
                <span style={{ minWidth: 22, padding: "0 7px", height: 18, background: on ? "rgba(255,255,255,0.18)" : "var(--cream-tert)", color: on ? "#fff" : "var(--fg-2)", borderRadius: 9, fontSize: 11, fontWeight: 700, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>{counts[o.id]}</span>
              </button>
            );
          })}
        </div>
        <div style={{ position: "relative", flex: "1 1 240px", maxWidth: 360, minWidth: 220 }}>
          <span style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", display: "flex" }}><Search size={17} color="var(--fg-3)" /></span>
          <input placeholder="Buscar por ID, visitante o finca…" value={query} onChange={(e) => setQuery(e.target.value)} style={{ width: "100%", fontFamily: "var(--font-sans)", fontSize: 15, color: "var(--fg-1)", borderRadius: "var(--radius)", background: "var(--surface)", border: "1px solid var(--sand)", padding: "11px 36px 11px 38px", outline: "none", boxSizing: "border-box" }} />
          {query && <button type="button" aria-label="Limpiar" onClick={() => setQuery("")} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", width: 26, height: 26, borderRadius: 6, border: "none", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><X size={15} color="var(--fg-3)" /></button>}
        </div>
      </div>

      {visible.length === 0 ? (
        <div style={{ background: "var(--surface)", border: "1px solid var(--outline-variant)", borderRadius: "var(--radius-lg)", padding: "60px 32px", textAlign: "center" }}>
          <div style={{ width: 56, height: 56, margin: "0 auto 16px", borderRadius: "50%", background: "var(--cream-tert)", display: "flex", alignItems: "center", justifyContent: "center" }}>{query.trim() ? <SearchX size={24} color="var(--brown-700)" /> : <HandCoins size={24} color="var(--brown-700)" />}</div>
          <h3 style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 19, color: "var(--fg-1)" }}>{query.trim() ? "Sin resultados" : "No hay reembolsos en este estado"}</h3>
          <p style={{ margin: "8px auto 0", maxWidth: 400, color: "var(--fg-2)", fontSize: 14, lineHeight: 1.55 }}>{query.trim() ? "Probá con otro término de búsqueda o cambiá el filtro de estado." : "Cuando se generen reembolsos en este estado vas a poder gestionarlos desde acá."}</p>
        </div>
      ) : (
        <div style={{ background: "var(--surface)", border: "1px solid var(--outline-variant)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 920 }}>
              <thead>
                <tr style={{ background: "var(--cream-tert)" }}>
                  <th style={thStyle}>Reembolso</th><th style={thStyle}>Fecha y hora pedido</th><th style={thStyle}>Reembolso / vencimiento</th><th style={thStyle}>Estado</th><th style={{ ...thStyle, textAlign: "right" }}>Monto</th><th style={{ ...thStyle, textAlign: "right" }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((r) => {
                  const reembolsada = r.estado === "reembolsado" || r.estado === "sistema";
                  const fechaResol = reembolsada ? r.fechaReembolso : vencimiento(r.fechaPedido);
                  const vencido = estaVencido(r);
                  return (
                    <tr key={r.id} style={{ borderBottom: "1px solid var(--cream-tert)" }}>
                      <td style={{ padding: 16, verticalAlign: "top" }}>
                        <div style={{ fontFamily: "var(--font-mono)", fontSize: 13.5, color: "var(--fg-1)", fontWeight: 600 }}>{r.id}</div>
                        <div style={{ fontSize: 13, color: "var(--fg-1)", marginTop: 4 }}>{r.visitante}</div>
                        <div style={{ fontSize: 12, color: "var(--fg-3)", marginTop: 2, display: "flex", alignItems: "center", gap: 5 }}><Warehouse size={12} color="var(--fg-3)" /> {r.finca}</div>
                      </td>
                      <td style={{ padding: 16, verticalAlign: "top", fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--fg-2)" }}>{fmtFechaHora(r.fechaPedido)}</td>
                      <td style={{ padding: 16, verticalAlign: "top" }}>
                        <div style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: vencido ? "var(--danger-fg)" : "var(--fg-2)", fontWeight: vencido ? 600 : 400 }}>{fmtFechaHora(fechaResol)}</div>
                        <div style={{ fontSize: 11.5, color: vencido ? "var(--danger-fg)" : "var(--fg-3)", marginTop: 2 }}>{reembolsada ? "Reembolsado" : vencido ? "Plazo vencido" : "Vence (30 días)"}</div>
                      </td>
                      <td style={{ padding: 16, verticalAlign: "top", width: 168 }}>
                        <EstadoPill estado={r.estado} />
                        {r.estado === "sistema" && <div style={{ fontFamily: "var(--font-mono)", fontSize: 11.5, color: "var(--fg-3)", marginTop: 6 }}>Deuda {r.deudaId}</div>}
                      </td>
                      <td style={{ padding: 16, verticalAlign: "top", textAlign: "right", whiteSpace: "nowrap", fontFamily: "var(--font-mono)", fontWeight: 600, fontSize: 15, color: "var(--fg-1)" }}>{moneyAr(r.monto)}</td>
                      <td style={{ padding: 16, verticalAlign: "top", textAlign: "right" }}>
                        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", flexWrap: "wrap" }}>
                          {r.estado === "impago" && <button type="button" className="btn btn-primary btn-sm" onClick={() => setReembolsar(r)}><HandCoins size={15} /> Reembolsar</button>}
                          {r.estado === "sistema" && <>
                            <button type="button" className="btn btn-neutral btn-sm" onClick={() => setDetalle(r)}><ReceiptText size={15} /> Detalle</button>
                            <button type="button" className="btn btn-primary btn-sm" onClick={() => router.push("/admin/deudas")}><Landmark size={15} /> Ir a deuda</button>
                          </>}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {detalle && <PagoModal refund={detalle} onClose={() => setDetalle(null)} />}
      {reembolsar && <ReembolsarModal refund={reembolsar} busy={isLoading} onClose={() => setReembolsar(null)} onSubmit={(form) => confirmarReembolso(reembolsar, form)} />}
      {toast && <div className="pop" style={{ position: "fixed", right: 24, bottom: 24, zIndex: 90, maxWidth: 420, background: "var(--green-800)", color: "#fff", borderRadius: "var(--radius)", padding: "14px 18px", display: "flex", alignItems: "center", gap: 11, fontWeight: 500, fontSize: 14.5, boxShadow: "var(--shadow-pop)" }}><ArrowRightCircle size={19} color="#fff" /> {toast}</div>}

      <style>{`.btn-sm { white-space: nowrap; }`}</style>
    </div>
  );
}

export default function ImpagasClient() {
  const { data, isLoading, error, reload } = useImpagas();
  return (
    <AsyncBoundary loading={isLoading} error={error} onRetry={reload} loadingLabel="Cargando reembolsos…">
      {data && <Inner initial={data} />}
    </AsyncBoundary>
  );
}
