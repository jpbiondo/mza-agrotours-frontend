"use client";

import {
  CalendarCheck, Users, Grape, Banknote, TrendingUp, Download, Plus,
} from "lucide-react";
import AsyncBoundary from "@/components/AsyncBoundary";
import { useEstablecimientos } from "@/hooks/useEstablecimientos";
import { usePanelDashboard } from "@/hooks/usePanelDashboard";
import type { PanelCultivo, PanelReserva, PanelStat, ReservaTone, CultivoState } from "@/types/panel";

const STAT_ICON = {
  "calendar-check": CalendarCheck,
  users: Users,
  grape: Grape,
  banknote: Banknote,
} as const;

const TONE_VARS: Record<ReservaTone, { bg: string; fg: string }> = {
  success: { bg: "var(--success-fill)", fg: "var(--success-fg)" },
  warning: { bg: "var(--warning-fill)", fg: "var(--warning-fg)" },
  info: { bg: "var(--info-fill)", fg: "var(--info-fg)" },
  danger: { bg: "var(--danger-fill)", fg: "var(--danger-fg)" },
};

const CULTIVO_TONE: Record<CultivoState, ReservaTone> = {
  harvest: "warning",
  growing: "success",
  rest: "info",
};

function Pill({ tone, children }: { tone: ReservaTone; children: React.ReactNode }) {
  const t = TONE_VARS[tone];
  return <span style={{ display: "inline-flex", alignItems: "center", borderRadius: "var(--radius-pill)", padding: "4px 11px", fontSize: 12, fontWeight: 700, background: t.bg, color: t.fg, whiteSpace: "nowrap" }}>{children}</span>;
}

function StatCard({ stat }: { stat: PanelStat }) {
  const Icon = STAT_ICON[stat.icon];
  return (
    <div className="card" style={{ flex: 1, minWidth: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--fg-2)", fontSize: 13, fontWeight: 500 }}>
        <Icon size={17} color="var(--green-600)" /> {stat.label}
      </div>
      <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 30, color: "var(--fg-1)", marginTop: 10 }}>{stat.value}</div>
      {stat.delta && (
        <div style={{ fontSize: 12.5, color: stat.tone === "success" ? "var(--success)" : "var(--fg-3)", marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}>
          {stat.tone === "success" && <TrendingUp size={13} />} {stat.delta}
        </div>
      )}
    </div>
  );
}

function ReservasTable({ reservas }: { reservas: PanelReserva[] }) {
  return (
    <div className="card" style={{ padding: 0, overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 24px", borderBottom: "1px solid var(--outline-variant)" }}>
        <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 18, color: "var(--fg-1)", margin: 0 }}>Próximas reservas</h3>
        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--fg-3)" }}>Reservas <span style={{ fontSize: 9.5, fontWeight: 700, textTransform: "uppercase", color: "var(--brown-700)", background: "var(--brown-100)", borderRadius: 999, padding: "1px 6px" }}>pronto</span></span>
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead>
            <tr style={{ textAlign: "left", color: "var(--fg-3)", fontSize: 11.5, textTransform: "uppercase", letterSpacing: ".05em" }}>
              <th style={th}>Código</th><th style={th}>Experiencia</th><th style={th}>Fecha</th><th style={th}>Cupos</th><th style={th}>Estado</th>
            </tr>
          </thead>
          <tbody>
            {reservas.map((r) => (
              <tr key={r.codigo} style={{ borderTop: "1px solid var(--cream-tert)" }}>
                <td style={{ ...td, fontFamily: "var(--font-mono)", color: "var(--fg-2)" }}>{r.codigo}</td>
                <td style={{ ...td, fontWeight: 500, color: "var(--fg-1)" }}>{r.experiencia}</td>
                <td style={td}>{r.fecha}</td>
                <td style={{ ...td, fontFamily: "var(--font-mono)" }}>{r.cupos}</td>
                <td style={td}><Pill tone={r.tone}>{r.estado}</Pill></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const th: React.CSSProperties = { padding: "12px 24px", fontWeight: 600 };
const td: React.CSSProperties = { padding: "14px 24px", color: "var(--fg-2)" };

function CultivosCard({ cultivos }: { cultivos: PanelCultivo[] }) {
  return (
    <div className="card">
      <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 18, color: "var(--fg-1)", margin: "0 0 16px" }}>Estado de cultivos</h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {cultivos.map((c) => (
          <div key={c.nombre} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <div>
              <div style={{ fontWeight: 600, color: "var(--fg-1)", fontSize: 14 }}>{c.nombre}</div>
              <div style={{ fontSize: 12.5, color: "var(--fg-3)" }}>{c.finca}</div>
            </div>
            <Pill tone={CULTIVO_TONE[c.state]}>{c.label}</Pill>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function PanelClient() {
  // El establecimiento activo lo elige el switcher del shell.
  const { activo } = useEstablecimientos();
  const fincaId = activo?.id ?? "";
  const { data, isLoading, error, reload } = usePanelDashboard(fincaId);

  return (
    <div style={{ minHeight: "100vh", background: "var(--cream-bg)" }}>

      <AsyncBoundary loading={isLoading} error={error} onRetry={reload} loadingLabel="Cargando tu panel…">
        {data && (
        <div style={{ maxWidth: 1240, margin: "0 auto", padding: "32px 28px 80px" }}>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap", gap: 16 }}>
            <div style={{ minWidth: 240 }}>
              <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 32, color: "var(--fg-1)", margin: 0, letterSpacing: "-.01em" }}>Panel</h1>
              <p style={{ margin: "6px 0 0", color: "var(--fg-2)", fontSize: 15 }}>Hola {data.saludoNombre}, esto es lo que pasa en {data.fincaNombre}.</p>
            </div>
            <div style={{ display: "flex", gap: 12, flexShrink: 0 }}>
              <button type="button" className="btn btn-neutral"><Download size={17} /> Exportar</button>
              <button type="button" className="btn btn-primary"><Plus size={17} /> Cargar experiencia</button>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 16, marginBottom: 40 }}>
            {data.stats.map((s) => <StatCard key={s.label} stat={s} />)}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "minmax(0,2fr) minmax(0,1fr)", gap: 24, alignItems: "start" }} className="panel-grid">
            <ReservasTable reservas={data.reservas} />
            <CultivosCard cultivos={data.cultivos} />
          </div>
        </div>
        )}
      </AsyncBoundary>

      <style>{`@media (max-width: 900px) { .panel-grid { grid-template-columns: 1fr !important; } }`}</style>
    </div>
  );
}
