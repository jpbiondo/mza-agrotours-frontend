"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, MapPin, Sprout, CreditCard, Hourglass, CheckCircle2, CalendarDays,
  CalendarCheck, ChevronLeft, ChevronRight, Info, ListChecks, ArrowRight, Ban, Clock, Loader,
  Grape, Scissors, Wine, Leaf, Cherry, Nut,
} from "lucide-react";
import ProducerShell from "@/components/panel/ProducerShell";
import { FINCAS } from "@/data/panel";
import { useCalendarioActividad } from "@/hooks/useCalendarioActividad";
import { MESES_LABEL, NOMBRES_DIA, fechaLarga } from "@/data/calendario";
import { estadoBucket } from "@/data/actividades-prod";
import type { DiaCelda, MesCal } from "@/types/calendario";
import type { ActividadProd } from "@/types/actividad-prod";

const ICONS: Record<string, React.ComponentType<{ size?: number; color?: string }>> = {
  grape: Grape, scissors: Scissors, wine: Wine, leaf: Leaf, cherry: Cherry, sprout: Sprout, nut: Nut, "map-pin": MapPin,
};

const TONES: Record<string, { bg: string; fg: string }> = {
  success: { bg: "var(--success-fill)", fg: "var(--success-fg)" },
  neutral: { bg: "var(--cream-tert)", fg: "var(--fg-2)" },
  info: { bg: "var(--info-fill)", fg: "var(--info-fg)" },
};

function Pill({ tone, children }: { tone: keyof typeof TONES; children: React.ReactNode }) {
  const t = TONES[tone];
  return <span style={{ display: "inline-flex", alignItems: "center", borderRadius: "var(--radius-pill)", padding: "4px 12px", fontSize: 12.5, fontWeight: 700, background: t.bg, color: t.fg }}>{children}</span>;
}

function MetricCard({ icon, label, value, sub, tone }: { icon: React.ReactNode; label: string; value: number; sub: string; tone: "green" | "warning" | "neutral" }) {
  const tones = {
    green: { bg: "var(--green-050)", brd: "var(--green-100)" },
    warning: { bg: "#FBEDE3", brd: "#EBD3BF" },
    neutral: { bg: "var(--cream-tert)", brd: "var(--outline-variant)" },
  }[tone];
  return (
    <div style={{ flex: "1 1 180px", minWidth: 160, background: "var(--surface)", border: "1px solid var(--outline-variant)", borderRadius: "var(--radius-lg)", padding: 20, display: "flex", alignItems: "center", gap: 16 }}>
      <div style={{ width: 46, height: 46, borderRadius: 12, flexShrink: 0, background: tones.bg, border: `1px solid ${tones.brd}`, display: "flex", alignItems: "center", justifyContent: "center" }}>{icon}</div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 26, fontWeight: 600, color: "var(--fg-1)", lineHeight: 1 }}>{value}</div>
        <div className="t-label" style={{ marginTop: 6 }}>{label}</div>
        <div style={{ fontSize: 12, color: "var(--fg-3)", marginTop: 3 }}>{sub}</div>
      </div>
    </div>
  );
}

function OccupancyBar({ pagadas, pendientes, cupoMax, height = 8 }: { pagadas: number; pendientes: number; cupoMax: number; height?: number }) {
  const max = cupoMax > 0 ? cupoMax : 1;
  const libres = Math.max(0, max - pagadas - pendientes);
  return (
    <div style={{ width: "100%", height, borderRadius: 999, overflow: "hidden", display: "flex", background: "var(--cream-tert)" }}>
      <div style={{ width: `${(pagadas / max) * 100}%`, background: "var(--green-700)" }} />
      <div style={{ width: `${(pendientes / max) * 100}%`, background: "var(--warning)" }} />
      <div style={{ width: `${(libres / max) * 100}%`, background: "var(--sand)" }} />
    </div>
  );
}

function LegendCupo({ color, label, n }: { color: string; label: string; n: number }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12.5, color: "var(--fg-2)" }}>
      <span style={{ width: 9, height: 9, borderRadius: 3, background: color, flexShrink: 0 }} />
      <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--fg-1)" }}>{n}</span> {label}
    </span>
  );
}

function DayCell({ cell, selected, onSelect }: { cell: DiaCelda | null; selected: boolean; onSelect: (d: number) => void }) {
  if (!cell) return <div />;
  if (!cell.disponible) {
    return <div style={{ minHeight: 62, borderRadius: 10, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "8px 0", color: "var(--fg-3)", opacity: 0.5, fontSize: 14 }}>{cell.dia}</div>;
  }
  const numColor = selected ? "#fff" : "var(--fg-1)";
  const subColor = selected ? "rgba(255,255,255,.82)" : "var(--fg-2)";
  const barTrack = selected ? "rgba(255,255,255,.28)" : "var(--cream-tert)";
  const pagFill = selected ? "#fff" : "var(--green-700)";
  const penFill = selected ? "rgba(255,255,255,.5)" : "var(--warning)";
  const pPag = cell.cupoMax > 0 ? Math.min(100, (cell.pagadas / cell.cupoMax) * 100) : 0;
  const pPen = cell.cupoMax > 0 ? Math.min(100 - pPag, (cell.pendientes / cell.cupoMax) * 100) : 0;
  const total = pPag + pPen;
  return (
    <button
      type="button"
      onClick={() => onSelect(cell.dia)}
      aria-label={`${cell.dia}: ${cell.pagadas} pagadas, ${cell.pendientes} en espera, cupo ${cell.cupoMax}`}
      style={{
        position: "relative", minHeight: 62, width: "100%", padding: "8px 7px 9px", borderRadius: 10, cursor: "pointer", textAlign: "left",
        display: "flex", flexDirection: "column", justifyContent: "space-between",
        background: selected ? "var(--green-800)" : "var(--green-050)",
        border: "1px solid " + (selected ? "var(--green-800)" : "var(--green-300)"),
        color: numColor, boxShadow: selected ? "inset 0 -2px 0 var(--green-900)" : "none",
      }}
    >
      <span style={{ fontSize: 15, fontWeight: selected ? 700 : 600, color: numColor, lineHeight: 1 }}>{cell.dia}</span>
      <div>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: subColor, marginBottom: 4 }}>{cell.pagadas}/{cell.cupoMax}</div>
        <div style={{ width: "100%", height: 4, borderRadius: 999, background: barTrack, overflow: "hidden" }}>
          <div style={{ width: `${total}%`, height: "100%", display: "flex" }}>
            <div style={{ width: `${total > 0 ? (pPag / total) * 100 : 0}%`, background: pagFill }} />
            <div style={{ width: `${total > 0 ? (pPen / total) * 100 : 0}%`, background: penFill }} />
          </div>
        </div>
      </div>
    </button>
  );
}

function Legend({ sw, label }: { sw: React.CSSProperties; label: string }) {
  return <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12, color: "var(--fg-2)" }}><span style={{ width: 14, height: 14, borderRadius: 4, ...sw }} /> {label}</div>;
}

function MonthCalendar({ mes, selectedDay, onSelect, onPrev, onNext, canPrev, canNext }: { mes: MesCal; selectedDay: number | null; onSelect: (d: number) => void; onPrev: () => void; onNext: () => void; canPrev: boolean; canNext: boolean }) {
  const firstDow = new Date(mes.year, mes.month, 1).getDay();
  const leading = (firstDow + 6) % 7;
  const cells: (DiaCelda | null)[] = [];
  for (let i = 0; i < leading; i++) cells.push(null);
  for (let d = 1; d <= mes.daysInMonth; d++) cells.push(mes.days[d]);
  while (cells.length % 7 !== 0) cells.push(null);

  const navBtn = (disabled: boolean): React.CSSProperties => ({ width: 36, height: 36, borderRadius: 8, border: "1px solid " + (disabled ? "var(--cream-tert)" : "var(--outline-variant)"), background: disabled ? "var(--cream-tert)" : "var(--surface)", cursor: disabled ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center" });

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <button type="button" onClick={onPrev} disabled={!canPrev} aria-label="Mes anterior" style={navBtn(!canPrev)}><ChevronLeft size={17} color={!canPrev ? "var(--fg-3)" : "var(--fg-1)"} /></button>
        <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18, color: "var(--fg-1)" }}>{MESES_LABEL[mes.month]} {mes.year}</div>
        <button type="button" onClick={onNext} disabled={!canNext} aria-label="Mes siguiente" style={navBtn(!canNext)}><ChevronRight size={17} color={!canNext ? "var(--fg-3)" : "var(--fg-1)"} /></button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6, marginBottom: 8 }}>
        {NOMBRES_DIA.map((n) => <div key={n} style={{ textAlign: "center", fontSize: 11, fontWeight: 700, color: "var(--fg-3)", textTransform: "uppercase", letterSpacing: ".06em", padding: "2px 0" }}>{n}</div>)}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6 }}>
        {cells.map((c, i) => <DayCell key={i} cell={c} selected={!!c && c.disponible && selectedDay === c.dia} onSelect={onSelect} />)}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 16, marginTop: 18, paddingTop: 16, borderTop: "1px solid var(--outline-variant)" }}>
        <Legend sw={{ background: "var(--green-050)", border: "1px solid var(--green-300)" }} label="Disponible" />
        <Legend sw={{ background: "var(--green-800)" }} label="Seleccionado" />
        <Legend sw={{ background: "var(--green-700)" }} label="Cupos pagados" />
        <Legend sw={{ background: "var(--warning)" }} label="En espera de pago" />
        <Legend sw={{ background: "transparent", border: "1px dashed var(--outline-variant)" }} label="No se dicta" />
      </div>
    </div>
  );
}

function DaySummaryCard({ mes, day, onVerReservas }: { mes: MesCal; day: number | null; onVerReservas: () => void }) {
  if (!day) {
    return (
      <div className="card" style={{ padding: 22, borderStyle: "dashed", borderColor: "var(--sand)", textAlign: "center" }}>
        <div style={{ width: 48, height: 48, borderRadius: "50%", background: "var(--green-050)", border: "1px solid var(--green-100)", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}><CalendarDays size={24} color="var(--green-700)" /></div>
        <div style={{ fontSize: 15, fontWeight: 600, color: "var(--fg-1)" }}>Seleccioná una fecha</div>
        <p style={{ margin: "6px auto 0", color: "var(--fg-2)", fontSize: 13.5, maxWidth: 280, lineHeight: 1.5 }}>Tocá un día disponible del calendario para ver sus cupos y las reservas pendientes.</p>
      </div>
    );
  }
  const cell = mes.days[day];
  const { pagadas, pendientes, cupoMax, lleno, pasado } = cell;
  const ocupados = pagadas + pendientes;
  const libres = Math.max(0, cupoMax - ocupados);

  return (
    <div className="card" style={{ padding: 0, overflow: "hidden" }}>
      <div style={{ padding: "18px 22px", background: "var(--green-050)", borderBottom: "1px solid var(--green-100)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
          <div style={{ width: 42, height: 42, borderRadius: 10, background: "var(--green-800)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "inset 0 -2px 0 var(--green-900)" }}><CalendarCheck size={21} color="#fff" /></div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 15.5, fontWeight: 700, color: "var(--fg-1)", lineHeight: 1.2 }}>{fechaLarga(mes.year, mes.month, day)}</div>
            <div style={{ fontSize: 12.5, color: "var(--fg-2)", marginTop: 3, fontFamily: "var(--font-mono)" }}>{cell.horario ? `${cell.horario.desde} – ${cell.horario.hasta} h` : ""}</div>
          </div>
        </div>
        <Pill tone={pasado ? "neutral" : "info"}>{pasado ? "Finalizado" : "Próximo"}</Pill>
      </div>

      <div style={{ padding: 22, display: "flex", flexDirection: "column", gap: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 13 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0, background: pagadas > 0 ? "var(--green-050)" : "var(--cream-tert)", border: `1px solid ${pagadas > 0 ? "var(--green-100)" : "var(--outline-variant)"}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            {pasado ? <CheckCircle2 size={22} color={pagadas > 0 ? "var(--green-700)" : "var(--fg-3)"} /> : <CreditCard size={22} color={pagadas > 0 ? "var(--green-700)" : "var(--fg-3)"} />}
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 7 }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 24, fontWeight: 700, color: "var(--fg-1)", lineHeight: 1 }}>{pagadas}</span>
              <span style={{ fontSize: 14, color: "var(--fg-2)" }}>{pasado ? (pagadas === 1 ? "reserva finalizada" : "reservas finalizadas") : (pagadas === 1 ? "reserva pagada" : "reservas pagadas")}</span>
            </div>
            <div style={{ fontSize: 12.5, color: "var(--fg-3)", marginTop: 4, lineHeight: 1.4 }}>
              {pasado ? "Jornada realizada y cobrada" : pagadas > 0 ? "Confirmadas — si cancelás o reprogramás el día, gestionás sus reembolsos" : "Todavía sin reservas pagadas para este día"}
            </div>
          </div>
        </div>

        {!pasado && (
          <div style={{ display: "flex", alignItems: "center", gap: 13, background: pendientes > 0 ? "#FBEDE3" : "var(--cream-tert)", border: `1px solid ${pendientes > 0 ? "#EBD3BF" : "var(--outline-variant)"}`, borderRadius: 12, padding: "12px 14px" }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, flexShrink: 0, background: "var(--surface)", border: `1px solid ${pendientes > 0 ? "#EBD3BF" : "var(--outline-variant)"}`, display: "flex", alignItems: "center", justifyContent: "center" }}><Hourglass size={19} color={pendientes > 0 ? "var(--warning)" : "var(--fg-3)"} /></div>
            <div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 7 }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 18, fontWeight: 700, color: "var(--fg-1)", lineHeight: 1 }}>{pendientes}</span>
                <span style={{ fontSize: 13.5, color: "var(--fg-2)" }}>{pendientes === 1 ? "cupo en espera de pago" : "cupos en espera de pago"}</span>
              </div>
              <div style={{ fontSize: 12, color: "var(--fg-3)", marginTop: 3, lineHeight: 1.4 }}>Retienen el cupo hasta confirmar el pago. Si no se paga, se libera.</div>
            </div>
          </div>
        )}

        <div style={{ background: "var(--cream-tert)", borderRadius: 12, padding: "14px 16px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <span className="t-label">Reparto de cupos</span>
            <span style={{ display: "inline-flex", alignItems: "baseline", gap: 2, fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 18, color: lleno ? "var(--warning)" : "var(--green-800)" }}>
              {ocupados}<span style={{ color: "var(--fg-3)", fontWeight: 600, fontSize: 14 }}>/{cupoMax}</span>
            </span>
          </div>
          <OccupancyBar pagadas={pagadas} pendientes={pendientes} cupoMax={cupoMax} height={9} />
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 14px", marginTop: 11 }}>
            <LegendCupo color="var(--green-700)" label={pasado ? "finalizados" : "pagados"} n={pagadas} />
            {!pasado && <LegendCupo color="var(--warning)" label="en espera" n={pendientes} />}
            <LegendCupo color="var(--sand)" label="libres" n={libres} />
          </div>
          {lleno && <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 11, fontSize: 12.5, color: "var(--warning)" }}><CheckCircle2 size={14} color="var(--warning)" /> Cupos completos para este día</div>}
        </div>

        <button type="button" className="btn btn-primary" onClick={onVerReservas} style={{ width: "100%", justifyContent: "center" }}>
          <ListChecks size={18} /> Ver detalle de reservas <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}

export default function CalendarioClient({ act }: { act: Pick<ActividadProd, "id" | "nombre" | "icon" | "estado" | "cultivos"> }) {
  const router = useRouter();
  const { data, isLoading } = useCalendarioActividad(act.id);
  const [mesIdx, setMesIdx] = useState(0);
  const [selDay, setSelDay] = useState<number | null>(null);

  const IconC = ICONS[act.icon] ?? Grape;
  const activo = estadoBucket(act.estado) !== "baja";

  return (
    <div style={{ minHeight: "100vh", background: "var(--cream-bg)" }}>
      <ProducerShell active="actividades" fincas={FINCAS} activeFincaId={FINCAS[0].id} onFincaChange={() => router.push("/panel/actividades")} />

      <div style={{ maxWidth: 1240, margin: "0 auto", padding: "24px 28px 80px" }}>
        <Link href="/panel/actividades" style={{ display: "inline-flex", alignItems: "center", gap: 7, textDecoration: "none", color: "var(--fg-2)", fontSize: 13.5, fontWeight: 600, marginBottom: 18 }}>
          <ArrowLeft size={16} /> Volver a actividades
        </Link>

        <div style={{ display: "flex", alignItems: "flex-start", gap: 18, flexWrap: "wrap", marginBottom: 8 }}>
          <div style={{ width: 60, height: 60, borderRadius: 16, flexShrink: 0, background: activo ? "var(--green-050)" : "var(--cream-tert)", border: `1px solid ${activo ? "var(--green-100)" : "var(--outline-variant)"}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <IconC size={30} color={activo ? "var(--green-700)" : "var(--fg-3)"} />
          </div>
          <div style={{ flex: "1 1 320px", minWidth: 260 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--fg-3)", fontSize: 13, marginBottom: 6 }}>
              <MapPin size={14} color="var(--brown-700)" /> <span>Finca La Escondida · Luján de Cuyo, Mendoza</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 30, color: "var(--fg-1)", margin: 0, letterSpacing: "-.01em" }}>{act.nombre}</h1>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--fg-3)" }}>{act.id}</span>
              <Pill tone={activo ? "success" : "neutral"}>{activo ? "Activo" : "Dada de baja"}</Pill>
            </div>
            <div style={{ marginTop: 14 }}>
              <div className="t-label" style={{ marginBottom: 7 }}>Cultivos asociados</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                {act.cultivos.map((c) => (
                  <span key={c} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "var(--green-100)", color: "var(--green-800)", borderRadius: "var(--radius-pill)", padding: "4px 11px", fontSize: 12.5, fontWeight: 600 }}><Sprout size={12} color="var(--green-700)" /> {c}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {!activo && (
          <div style={{ display: "flex", gap: 13, alignItems: "flex-start", background: "var(--cream-tert)", border: "1px solid var(--outline)", borderRadius: "var(--radius-lg)", padding: "14px 18px", margin: "20px 0 4px" }}>
            <div style={{ width: 38, height: 38, borderRadius: "50%", background: "var(--surface)", border: "1px solid var(--outline)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Ban size={19} color="var(--fg-2)" /></div>
            <div>
              <strong style={{ fontSize: 14.5, color: "var(--fg-1)" }}>Actividad dada de baja</strong>
              <p style={{ margin: "3px 0 0", fontSize: 13.5, color: "var(--fg-2)", lineHeight: 1.5 }}>Esta actividad está inactiva. Podés consultar su calendario y reservas, pero no se puede reprogramar ni cancelar la jornada de ningún día.</p>
            </div>
          </div>
        )}

        {isLoading || !data ? (
          <div style={{ background: "var(--surface)", border: "1px solid var(--outline-variant)", borderRadius: "var(--radius-lg)", padding: "72px 24px", textAlign: "center", color: "var(--fg-3)", marginTop: 26 }}>
            <Loader size={24} className="spin" /><div style={{ marginTop: 12, fontSize: 14 }}>Cargando calendario…</div>
          </div>
        ) : (
          <>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap", margin: "26px 0" }}>
              <MetricCard icon={<CreditCard size={22} color="var(--green-700)" />} label="Reservas pagadas" value={data.metricas.pagadas} sub="Confirmadas en días próximos" tone="green" />
              <MetricCard icon={<Hourglass size={22} color="var(--warning)" />} label="En espera de pago" value={data.metricas.pendientes} sub="Cupos retenidos hasta el pago" tone="warning" />
              <MetricCard icon={<CheckCircle2 size={22} color="var(--fg-2)" />} label="Finalizadas" value={data.metricas.finalizadas} sub="Jornadas ya realizadas" tone="neutral" />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 320px", gap: 24, alignItems: "start" }} className="cal-grid">
              <div style={{ display: "flex", flexDirection: "column", gap: 20, minWidth: 0 }}>
                <div className="card" style={{ padding: 24 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 18 }}>
                    <CalendarDays size={19} color="var(--green-800)" />
                    <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 20, color: "var(--fg-1)", margin: 0 }}>Calendario de disponibilidad</h2>
                  </div>
                  <p style={{ margin: "0 0 20px", color: "var(--fg-2)", fontSize: 14, lineHeight: 1.5 }}>
                    Sólo los días resaltados están disponibles al público. El número de cada día son las <strong style={{ color: "var(--fg-1)" }}>reservas pagadas</strong>; seleccioná uno para ver el reparto de cupos.
                  </p>
                  <MonthCalendar
                    mes={data.meses[mesIdx]}
                    selectedDay={selDay}
                    onSelect={setSelDay}
                    onPrev={() => { if (mesIdx > 0) { setMesIdx(mesIdx - 1); setSelDay(null); } }}
                    onNext={() => { if (mesIdx < data.meses.length - 1) { setMesIdx(mesIdx + 1); setSelDay(null); } }}
                    canPrev={mesIdx > 0}
                    canNext={mesIdx < data.meses.length - 1}
                  />
                </div>
                <DaySummaryCard mes={data.meses[mesIdx]} day={selDay} onVerReservas={() => router.push("/panel/reservas")} />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 16, minWidth: 0 }}>
                <div className="card" style={{ padding: 20 }}>
                  <div className="t-label" style={{ marginBottom: 12, display: "flex", alignItems: "center", gap: 7 }}><Clock size={14} color="var(--fg-2)" /> Días y horas disponibles</div>
                  <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
                    {data.dias.map((d, i) => (
                      <li key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, fontSize: 14.5, color: "var(--fg-1)", padding: "11px 0", borderBottom: i < data.dias.length - 1 ? "1px solid var(--cream-tert)" : "none" }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 9, fontWeight: 600 }}><span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--green-700)" }} /> {d.dia}</span>
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: 13.5, color: "var(--fg-2)" }}>{d.desde} – {d.hasta}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="card" style={{ padding: 18, background: "var(--cream-tert)" }}>
                  <div style={{ display: "flex", gap: 11, alignItems: "flex-start" }}>
                    <Info size={18} color="var(--brown-700)" style={{ marginTop: 1, flexShrink: 0 }} />
                    <p style={{ margin: 0, fontSize: 13, color: "var(--fg-2)", lineHeight: 1.5 }}>Los números muestran la cantidad de reservas pagadas sobre los cupos máximos de ese día.</p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <style>{`@media (max-width: 900px) { .cal-grid { grid-template-columns: 1fr !important; } }`}</style>
    </div>
  );
}
