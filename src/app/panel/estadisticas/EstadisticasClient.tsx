"use client";

import { useEffect, useState } from "react";
import {
  Users, Banknote, CalendarX, TrendingUp, CheckCircle2, Info, Download, X, Loader,
  FileText, FileSpreadsheet, Table2, AlertOctagon, Check,
  Grape, Sprout, Scissors, Wheat, Apple,
} from "lucide-react";
import AsyncBoundary from "@/components/AsyncBoundary";
import ProducerShell from "@/components/panel/ProducerShell";
import { Donut, BarChart, OccupancyBar } from "@/components/panel/charts";
import { FINCAS } from "@/data/panel";
import { PERIODOS, periodoMeta, fmtMoney, fmtSignedPct } from "@/data/estadisticas";
import { useEstadisticas, useExportarReporte, type ExportOpts } from "@/hooks/useEstadisticas";
import type { ActividadPerf, Periodo } from "@/types/estadisticas";

const ICONS: Record<string, React.ComponentType<{ size?: number; color?: string }>> = {
  grape: Grape, sprout: Sprout, scissors: Scissors, wheat: Wheat, apple: Apple,
};

type ToastData = { tone: "success" | "danger"; title: string; sub: string } | null;

function PeriodSelect({ value, onChange }: { value: Periodo; onChange: (v: Periodo) => void }) {
  return (
    <div style={{ display: "inline-flex", background: "var(--surface)", border: "1px solid var(--outline-variant)", borderRadius: "var(--radius)", padding: 4, gap: 2 }}>
      {PERIODOS.map((p) => {
        const on = p.value === value;
        return (
          <button key={p.value} type="button" onClick={() => onChange(p.value)} style={{ padding: "8px 14px", border: "none", background: on ? "var(--green-800)" : "transparent", color: on ? "var(--fg-on-dark)" : "var(--fg-2)", borderRadius: "calc(var(--radius) - 2px)", fontFamily: "var(--font-sans)", fontSize: 13.5, fontWeight: on ? 600 : 500, cursor: "pointer", boxShadow: on ? "inset 0 -2px 0 var(--green-900)" : "none" }}>
            {p.label}
          </button>
        );
      })}
    </div>
  );
}

function KpiCard({ title, icon, footer, footerTone = "neutral", children }: { title: string; icon: React.ReactNode; footer: React.ReactNode; footerTone?: "neutral" | "success"; children: React.ReactNode }) {
  const footerColor = footerTone === "success" ? "var(--success-fg)" : "var(--fg-2)";
  return (
    <div className="card" style={{ padding: 24, display: "flex", flexDirection: "column", minHeight: 200 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div className="t-label" style={{ margin: 0 }}>{title}</div>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: "var(--green-050)", display: "flex", alignItems: "center", justifyContent: "center" }}>{icon}</div>
      </div>
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>{children}</div>
      <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid var(--cream-tert)", fontSize: 13, color: footerColor, lineHeight: 1.4, display: "flex", alignItems: "center", gap: 6 }}>{footer}</div>
    </div>
  );
}

function ActivitiesTable({ rows, onExport }: { rows: ActividadPerf[]; onExport: () => void }) {
  return (
    <div className="card" style={{ padding: 0, overflow: "hidden" }}>
      <div style={{ padding: "20px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap", borderBottom: "1px solid var(--outline-variant)" }}>
        <div>
          <h2 style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 20, color: "var(--fg-1)" }}>Performance por actividad</h2>
          <p style={{ margin: "4px 0 0", color: "var(--fg-3)", fontSize: 13 }}>Ranking de ocupación de tus experiencias en el período seleccionado.</p>
        </div>
        <button type="button" className="btn btn-neutral btn-sm" onClick={onExport} style={{ display: "inline-flex", alignItems: "center", gap: 7 }}><Download size={15} /> Exportar</button>
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead>
            <tr style={{ textAlign: "left", color: "var(--fg-3)", fontSize: 11.5, textTransform: "uppercase", letterSpacing: ".05em", borderBottom: "1px solid var(--cream-tert)" }}>
              <th style={{ padding: "12px 24px", fontWeight: 600 }}>Nombre actividad</th>
              <th style={{ padding: "12px 12px", fontWeight: 600, textAlign: "right" }}>Cupos</th>
              <th style={{ padding: "12px 12px", fontWeight: 600, textAlign: "right" }}>Reservas</th>
              <th style={{ padding: "12px 12px", fontWeight: 600, textAlign: "right" }}>Ingresos</th>
              <th style={{ padding: "12px 24px", fontWeight: 600, width: 240 }}>Ocupación</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((a) => {
              const IconC = ICONS[a.icon] ?? Grape;
              return (
                <tr key={a.id} style={{ borderBottom: "1px solid var(--cream-tert)" }}>
                  <td style={{ padding: "14px 24px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ width: 36, height: 36, borderRadius: "50%", background: a.color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><IconC size={18} color="rgba(255,255,255,.92)" /></div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 600, color: "var(--fg-1)", fontSize: 14 }}>{a.nombre}</div>
                        <div style={{ fontSize: 12, color: "var(--fg-3)", marginTop: 2 }}>{a.cultivo}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: "14px 12px", textAlign: "right", fontFamily: "var(--font-mono)", fontWeight: 500, color: "var(--fg-2)" }}>{a.cupos}</td>
                  <td style={{ padding: "14px 12px", textAlign: "right", fontFamily: "var(--font-mono)", fontWeight: 500, color: "var(--fg-2)" }}>{a.reservas}</td>
                  <td style={{ padding: "14px 12px", textAlign: "right", fontFamily: "var(--font-mono)", fontWeight: 600, color: "var(--fg-1)" }}>{fmtMoney(a.ingresos)}</td>
                  <td style={{ padding: "14px 24px" }}><OccupancyBar value={a.ocupacion} color={a.color} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ExportModal({ busy, onClose, onConfirm }: { busy: boolean; onClose: () => void; onConfirm: (o: ExportOpts) => void }) {
  const [format, setFormat] = useState<ExportOpts["format"]>("pdf");
  const [scope, setScope] = useState<ExportOpts["scope"]>("performance");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const formats = [
    { id: "pdf" as const, label: "PDF", sub: "Reporte con formato y gráficos", icon: <FileText size={20} /> },
    { id: "csv" as const, label: "CSV", sub: "Datos tabulares, separado por comas", icon: <FileSpreadsheet size={20} /> },
    { id: "xlsx" as const, label: "Excel", sub: "Hoja de cálculo .xlsx", icon: <Table2 size={20} /> },
  ];

  return (
    <div onMouseDown={onClose} style={{ position: "fixed", inset: 0, background: "rgba(42,38,32,.45)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, backdropFilter: "blur(2px)" }}>
      <div className="pop" onMouseDown={(e) => e.stopPropagation()} style={{ position: "relative", background: "var(--surface)", borderRadius: "var(--radius-lg)", border: "1px solid var(--outline-variant)", boxShadow: "var(--shadow-pop)", width: 520, maxWidth: "100%", padding: "28px 28px 24px" }}>
        <button type="button" onClick={onClose} aria-label="Cerrar" style={{ position: "absolute", top: 14, right: 14, width: 32, height: 32, borderRadius: "var(--radius)", border: "none", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><X size={18} color="var(--fg-2)" /></button>
        <h3 style={{ margin: "0 0 8px", fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 22, color: "var(--fg-1)" }}>Exportar reporte</h3>
        <p style={{ margin: "0 0 22px", fontSize: 14, color: "var(--fg-2)", lineHeight: 1.5 }}>Vas a descargar los datos de performance del período seleccionado. Elegí qué incluir y en qué formato.</p>

        <div className="t-label" style={{ marginBottom: 10 }}>Contenido</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 }}>
          {[
            { id: "performance" as const, label: "Performance por actividad", sub: "Tabla con cupos, reservas y % de ocupación" },
            { id: "completo" as const, label: "Reporte completo", sub: "Incluye KPIs, gráfico mensual y tabla" },
          ].map((s) => {
            const on = scope === s.id;
            return (
              <label key={s.id} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: 14, border: `${on ? 2 : 1}px solid ${on ? "var(--green-800)" : "var(--outline-variant)"}`, background: on ? "var(--green-050)" : "var(--surface)", borderRadius: "var(--radius)", cursor: "pointer", margin: on ? 0 : 1 }}>
                <input type="radio" name="scope" checked={on} onChange={() => setScope(s.id)} style={{ marginTop: 3, accentColor: "var(--green-800)" }} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: "var(--fg-1)" }}>{s.label}</div>
                  <div style={{ fontSize: 12.5, color: "var(--fg-3)", marginTop: 2 }}>{s.sub}</div>
                </div>
              </label>
            );
          })}
        </div>

        <div className="t-label" style={{ marginBottom: 10 }}>Formato</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 26 }}>
          {formats.map((f) => {
            const on = format === f.id;
            return (
              <button key={f.id} type="button" onClick={() => setFormat(f.id)} style={{ padding: "14px 12px", border: `${on ? 2 : 1}px solid ${on ? "var(--green-800)" : "var(--outline-variant)"}`, background: on ? "var(--green-050)" : "var(--surface)", borderRadius: "var(--radius)", cursor: "pointer", textAlign: "left", display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-start", margin: on ? 0 : 1 }}>
                <span style={{ color: on ? "var(--green-800)" : "var(--fg-2)" }}>{f.icon}</span>
                <div style={{ fontWeight: 600, fontSize: 14, color: "var(--fg-1)" }}>{f.label}</div>
                <div style={{ fontSize: 11.5, color: "var(--fg-3)", lineHeight: 1.3 }}>{f.sub}</div>
              </button>
            );
          })}
        </div>

        <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
          <button type="button" className="btn btn-neutral" onClick={onClose} disabled={busy}>Cancelar</button>
          <button type="button" className="btn btn-primary" onClick={() => onConfirm({ format, scope })} disabled={busy}>
            {busy ? <><Loader size={17} className="spin" /> Generando…</> : <><Download size={17} /> Descargar</>}
          </button>
        </div>
      </div>
    </div>
  );
}

function ToastView({ toast, onClose }: { toast: ToastData; onClose: () => void }) {
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(onClose, 4400);
    return () => clearTimeout(t);
  }, [toast, onClose]);
  if (!toast) return null;
  const danger = toast.tone === "danger";
  return (
    <div className="pop" style={{ position: "fixed", right: 24, bottom: 24, zIndex: 110, display: "flex", alignItems: "flex-start", gap: 13, background: "var(--surface)", border: "1px solid var(--outline-variant)", borderRadius: "var(--radius)", boxShadow: "var(--shadow-pop)", padding: "16px 18px", width: 380, maxWidth: "calc(100vw - 48px)" }}>
      <div style={{ width: 30, height: 30, borderRadius: "50%", background: danger ? "var(--danger)" : "var(--success)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{danger ? <AlertOctagon size={18} color="#fff" /> : <Check size={18} color="#fff" />}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 14.5, color: "var(--fg-1)", lineHeight: 1.3 }}>{toast.title}</div>
        <div style={{ fontSize: 13, color: "var(--fg-2)", marginTop: 4, lineHeight: 1.4 }}>{toast.sub}</div>
      </div>
      <button type="button" onClick={onClose} aria-label="Cerrar" style={{ background: "transparent", border: "none", cursor: "pointer", padding: 2 }}><X size={15} color="var(--fg-3)" /></button>
    </div>
  );
}

export default function EstadisticasClient() {
  const [fincaId, setFincaId] = useState(FINCAS[0].id);
  const { data, isLoading, error, reload } = useEstadisticas(fincaId);
  const { exportar, isLoading: exporting } = useExportarReporte();
  const [period, setPeriod] = useState<Periodo>("6m");
  const [exportOpen, setExportOpen] = useState(false);
  const [toast, setToast] = useState<ToastData>(null);

  const meta = periodoMeta(period);

  async function onConfirmExport(opts: ExportOpts) {
    await exportar(opts);
    setExportOpen(false);
    setToast({ tone: "success", title: `Reporte generado en ${opts.format.toUpperCase()}`, sub: opts.scope === "completo" ? "Se descargó el reporte completo con KPIs, gráfico y tabla." : "Se descargó la tabla de performance por actividad." });
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--cream-bg)" }}>
      <ProducerShell active="estadisticas" fincas={FINCAS} activeFincaId={fincaId} onFincaChange={setFincaId} />

      <main style={{ maxWidth: 1240, margin: "0 auto", padding: "32px 28px 80px" }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 20, marginBottom: 32 }}>
          <div>
            <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 32, color: "var(--fg-1)", margin: 0, letterSpacing: "-.01em" }}>Estadísticas y reportes</h1>
            <p style={{ margin: "6px 0 0", color: "var(--fg-2)", fontSize: 15 }}>Desempeño de tus experiencias en <strong style={{ color: "var(--fg-1)" }}>{meta.label.toLowerCase()}</strong> · {meta.sub}</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <PeriodSelect value={period} onChange={setPeriod} />
            <button type="button" className="btn btn-primary" onClick={() => setExportOpen(true)}><Download size={17} /> Exportar reporte</button>
          </div>
        </div>

        <AsyncBoundary loading={isLoading} error={error} onRetry={reload} loadingLabel="Cargando estadísticas…" pad={100}>
          {(() => {
          if (!data) return null;
          const kpis = data.kpisByPeriod[period];
          const series = data.seriesByPeriod[period];
          return (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "1.05fr 1fr 1fr", gap: 20, marginBottom: 24 }} className="stats-kpi-grid">
                <KpiCard title="Ocupación" icon={<Users size={16} color="var(--green-800)" />} footerTone="success" footer={<><CheckCircle2 size={14} color="var(--success-fg)" /> {kpis.ocupacionFilled} de {kpis.ocupacionTotal} cupos reservados</>}>
                  <Donut value={kpis.ocupacionPct} size={150} stroke={16} />
                </KpiCard>

                <KpiCard title="Beneficios totales" icon={<Banknote size={16} color="var(--green-800)" />} footerTone="success" footer={<><TrendingUp size={14} color="var(--success-fg)" /><span><strong>{fmtSignedPct(kpis.beneficiosDelta)}</strong> vs. período anterior <span style={{ color: "var(--fg-3)" }}>({meta.rangoAnterior})</span></span></>}>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 40, color: "var(--fg-1)", lineHeight: 1, letterSpacing: "-0.01em" }}>{fmtMoney(kpis.beneficios)}</div>
                    <div style={{ marginTop: 8, fontSize: 12.5, color: "var(--fg-3)", fontFamily: "var(--font-mono)" }}>Pesos argentinos · neto</div>
                    <div style={{ marginTop: 4, fontSize: 12, color: "var(--fg-3)", fontFamily: "var(--font-mono)" }}>{meta.rangoActual}</div>
                  </div>
                </KpiCard>

                <KpiCard title="Cancelaciones" icon={<CalendarX size={16} color="var(--green-800)" />} footer={<><Info size={14} color="var(--fg-2)" /> {kpis.cancelacionCount} reservas canceladas</>}>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 56, color: "var(--fg-1)", lineHeight: 1, letterSpacing: "-0.02em" }}>{kpis.cancelacionPct}<span style={{ fontSize: "0.5em", color: "var(--fg-2)", marginLeft: 2 }}>%</span></div>
                    <div style={{ marginTop: 8, fontSize: 12.5, color: "var(--fg-3)", fontFamily: "var(--font-mono)" }}>sobre el total de reservas</div>
                  </div>
                </KpiCard>
              </div>

              <div className="card" style={{ padding: 24, marginBottom: 24 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18, gap: 16, flexWrap: "wrap" }}>
                  <div>
                    <h2 style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 20, color: "var(--fg-1)" }}>{series.title}</h2>
                    <p style={{ margin: "4px 0 0", color: "var(--fg-3)", fontSize: 13 }}>{series.sub}</p>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 12.5, color: "var(--fg-2)", flexWrap: "wrap" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ display: "inline-block", width: 12, height: 12, background: "#EAF1E2", border: "1.5px solid var(--green-600)", borderRadius: 3 }} /> Reservas confirmadas</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--fg-3)" }}>$</span> Ganancia del período</div>
                  </div>
                </div>
                <BarChart data={series.bars} height={260} />
              </div>

              <ActivitiesTable rows={data.actividades} onExport={() => setExportOpen(true)} />
            </>
          );
        })()}
        </AsyncBoundary>
      </main>

      {exportOpen && <ExportModal busy={exporting} onClose={() => setExportOpen(false)} onConfirm={onConfirmExport} />}
      <ToastView toast={toast} onClose={() => setToast(null)} />

      <style>{`@media (max-width: 860px) { .stats-kpi-grid { grid-template-columns: 1fr !important; } }`}</style>
    </div>
  );
}
