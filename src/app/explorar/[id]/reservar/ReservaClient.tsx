"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  MapPin, Star, Clock, Users, Ban, ShieldCheck, AlertTriangle, CalendarCheck,
  ChevronLeft, ChevronRight, ChevronRight as Crumb,
} from "lucide-react";
import { moneyAr } from "@/lib/format";
import { CALENDARIO, CUPO_MAXIMO, NOMBRES_DIA } from "@/data/actividad-detalle";
import {
  RANGOS, TITULAR, precioRango, rangoPermitido, evalViajero, fechaLabel, codigoReserva,
  type Viajero, type Precios,
} from "@/data/reserva";
import TravelersList from "./Travelers";
import { PaymentSheet, SuccessModal, FailModal, CancelToast, type Outcome } from "./PaymentSheet";
import type { ActividadDetalle } from "@/types/catalogo";

function SectionHead({ n, title, sub }: { n: string; title: string; sub: string }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 14 }}>
      <span style={{ width: 30, height: 30, borderRadius: "50%", background: "var(--green-800)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15, flexShrink: 0 }}>{n}</span>
      <div>
        <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 19, color: "var(--fg-1)", margin: 0 }}>{title}</h2>
        <p style={{ margin: "3px 0 0", fontSize: 13.5, color: "var(--fg-2)" }}>{sub}</p>
      </div>
    </div>
  );
}

function MonthCalendar({
  monthIdx, selDay, selMonthIdx, onMonth, onSelect,
}: {
  monthIdx: number; selDay: number | null; selMonthIdx: number | null;
  onMonth: (i: number) => void; onSelect: (day: number, mi: number) => void;
}) {
  const mes = CALENDARIO[monthIdx];
  const firstDow = useMemo(() => (new Date(mes.year, mes.month, 1).getDay() + 6) % 7, [mes]);
  const daysInMonth = new Date(mes.year, mes.month + 1, 0).getDate();
  const cells: (number | null)[] = [...Array(firstDow).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <button type="button" onClick={() => onMonth(Math.max(0, monthIdx - 1))} disabled={monthIdx === 0} style={navBtn(monthIdx === 0)}><ChevronLeft size={17} /></button>
        <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 15.5, color: "var(--fg-1)" }}>{mes.label}</span>
        <button type="button" onClick={() => onMonth(Math.min(CALENDARIO.length - 1, monthIdx + 1))} disabled={monthIdx === CALENDARIO.length - 1} style={navBtn(monthIdx === CALENDARIO.length - 1)}><ChevronRight size={17} /></button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4, marginBottom: 6 }}>
        {NOMBRES_DIA.map((d) => (
          <div key={d} style={{ textAlign: "center", fontSize: 11, fontWeight: 700, color: "var(--fg-3)", textTransform: "uppercase", letterSpacing: ".03em" }}>{d}</div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4 }}>
        {cells.map((d, idx) => {
          if (d === null) return <div key={idx} />;
          const info = mes.days[d];
          const disponible = info.state === "disponible";
          const sel = selMonthIdx === monthIdx && selDay === d;
          return (
            <button
              key={idx}
              type="button"
              disabled={!disponible}
              onClick={() => onSelect(d, monthIdx)}
              style={{
                aspectRatio: "1", borderRadius: 9, cursor: disponible ? "pointer" : "default",
                fontFamily: "var(--font-sans)", fontSize: 13.5, fontWeight: sel ? 700 : 500,
                background: sel ? "var(--green-800)" : disponible ? "var(--surface)" : "transparent",
                color: sel ? "#fff" : disponible ? "var(--fg-1)" : "var(--fg-3)",
                border: disponible && !sel ? "1px solid var(--outline-variant)" : "1px solid transparent",
                opacity: disponible ? 1 : 0.4,
              }}
            >
              {d}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function navBtn(disabled: boolean): React.CSSProperties {
  return { width: 32, height: 32, borderRadius: 8, border: "1px solid var(--outline-variant)", background: "var(--surface)", cursor: disabled ? "not-allowed" : "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "var(--fg-2)", opacity: disabled ? 0.4 : 1 };
}

function CuposPanel({ selLabel, cupos, reservados, totalRows, insuf }: { selLabel: string | null; cupos: number; reservados: number; totalRows: number; insuf: boolean }) {
  if (!selLabel) {
    return (
      <div style={{ padding: "16px 14px", background: "var(--green-050)", border: "1px solid var(--green-300)", borderRadius: 10, fontSize: 13, color: "var(--green-800)", height: "100%" }}>
        <CalendarCheck size={18} color="var(--green-800)" />
        <div style={{ fontWeight: 600, margin: "6px 0 2px" }}>Elegí un día disponible</div>
        <div style={{ color: "var(--fg-2)", lineHeight: 1.4 }}>Seleccioná una fecha para ver los cupos disponibles.</div>
      </div>
    );
  }
  const bajo = cupos <= 3;
  const barColor = insuf ? "var(--danger)" : bajo ? "var(--warning)" : "var(--green-600)";
  const numColor = insuf ? "var(--danger)" : bajo ? "var(--warning)" : "var(--green-800)";
  return (
    <div style={{ border: "1px solid var(--outline-variant)", borderRadius: 12, padding: 16, background: "var(--surface)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <CalendarCheck size={17} color="var(--green-800)" />
        <span style={{ fontSize: 14, fontWeight: 700, color: "var(--fg-1)" }}>{selLabel}</span>
      </div>
      <div style={{ fontSize: 11, color: "var(--fg-3)", textTransform: "uppercase", letterSpacing: ".06em", fontWeight: 600 }}>Cupos disponibles</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 7, margin: "3px 0 2px" }}>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 28, fontWeight: 700, color: numColor }}>{cupos}</span>
        <span style={{ fontSize: 13, color: "var(--fg-3)" }}>de {CUPO_MAXIMO} lugares</span>
      </div>
      <div style={{ fontSize: 12, color: "var(--fg-3)", marginBottom: 12 }}>{reservados} ya reservados</div>
      <div style={{ height: 7, borderRadius: 4, background: "var(--cream-tert)", overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${(cupos / CUPO_MAXIMO) * 100}%`, background: barColor, borderRadius: 4 }} />
      </div>
      <div style={{ marginTop: 12, padding: "8px 10px", borderRadius: 8, background: insuf ? "var(--danger-fill)" : "var(--cream-tert)", fontSize: 12, fontWeight: 600, color: insuf ? "var(--danger-fg)" : "var(--fg-2)", display: "flex", alignItems: "center", gap: 7 }}>
        <Users size={14} color={insuf ? "var(--danger)" : "var(--fg-2)"} />
        {totalRows} {totalRows === 1 ? "visitante" : "visitantes"} en la reserva
      </div>
    </div>
  );
}

function InfoReserva({ a, precios }: { a: ActividadDetalle; precios: Precios }) {
  return (
    <div className="card" style={{ padding: 22 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, marginBottom: 16 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "var(--fg-1)", lineHeight: 1.3 }}>{a.titulo}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 5, fontSize: 13, color: "var(--fg-2)" }}>
            <MapPin size={14} color="var(--brown-700)" /> {a.finca} · {a.loc}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", background: "var(--cream-tert)", borderRadius: 999, fontSize: 12.5, fontWeight: 600, flexShrink: 0 }}>
          <Star size={13} color="#C9A227" fill="#C9A227" /> {a.rating.toFixed(1)}
        </div>
      </div>

      <div style={{ display: "flex", gap: 16, padding: "12px 14px", background: "var(--green-050)", border: "1px solid var(--green-300)", borderRadius: 10, marginBottom: 18 }}>
        <Meta icon={<Clock size={16} color="var(--green-800)" />} label="Duración" value={a.duracion} />
        <div style={{ width: 1, background: "var(--green-300)" }} />
        <Meta icon={<Users size={16} color="var(--green-800)" />} label="Cupo máximo" value={`${CUPO_MAXIMO} personas`} />
      </div>

      <div className="t-label" style={{ marginBottom: 10 }}>Precio por rango etario</div>
      <div>
        {RANGOS.map((r, i) => {
          const permitido = rangoPermitido(precios, r.id);
          const p = precioRango(precios, r.id);
          return (
            <div key={r.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderTop: i === 0 ? "none" : "1px solid var(--cream-tert)" }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: permitido ? "var(--fg-1)" : "var(--fg-3)" }}>{r.label}</div>
                <div style={{ fontSize: 12, color: "var(--fg-3)" }}>{r.sub}</div>
              </div>
              {permitido ? (
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 14.5, fontWeight: 600, color: p > 0 ? "var(--fg-1)" : "var(--green-800)" }}>
                  {p > 0 ? moneyAr(p) : "Sin cargo"}
                </div>
              ) : (
                <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12.5, fontWeight: 600, color: "var(--danger-fg)" }}>
                  <Ban size={13} color="var(--danger)" /> No permitido
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Meta({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0 }}>
      {icon}
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 11, color: "var(--fg-3)", textTransform: "uppercase", letterSpacing: ".05em", fontWeight: 600, whiteSpace: "nowrap" }}>{label}</div>
        <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--fg-1)", whiteSpace: "nowrap" }}>{value}</div>
      </div>
    </div>
  );
}

const ESTADO_PILL: Record<string, { bg: string; fg: string; label: string }> = {
  pendiente: { bg: "var(--warning-fill)", fg: "var(--warning-fg)", label: "Pendiente de pago" },
  pagada: { bg: "var(--success-fill)", fg: "var(--success-fg)", label: "Pagada" },
  expirada: { bg: "var(--danger-fill)", fg: "var(--danger-fg)", label: "Expirada" },
};

export default function ReservaClient({ a }: { a: ActividadDetalle }) {
  const precios = a.precios as Precios;
  const [monthIdx, setMonthIdx] = useState(0);
  const [selDay, setSelDay] = useState<number | null>(25);
  const [selMonthIdx, setSelMonthIdx] = useState<number | null>(0);
  const [viajeros, setViajeros] = useState<Viajero[]>([{ ...TITULAR }]);

  const [reservaEstado, setReservaEstado] = useState<string | null>(null);
  const [codigo, setCodigo] = useState<string | null>(null);
  const [payOpen, setPayOpen] = useState(false);
  const [okOpen, setOkOpen] = useState(false);
  const [failOpen, setFailOpen] = useState(false);
  const [toast, setToast] = useState(false);

  const selCal = selMonthIdx != null ? CALENDARIO[selMonthIdx] : null;
  const selData = selCal && selDay ? selCal.days[selDay] : null;
  const haySeleccion = !!(selData && selData.state === "disponible");
  const cupos = haySeleccion ? selData!.cupos : 0;
  const reservados = haySeleccion ? Math.max(0, CUPO_MAXIMO - cupos) : 0;
  const selLabel = haySeleccion && selCal && selDay ? fechaLabel(selCal, selDay) : null;

  const evals = useMemo(() => viajeros.map((v) => evalViajero(v, precios)), [viajeros, precios]);
  const totalRows = viajeros.length;
  const cuposInsuficientes = haySeleccion && totalRows > cupos;
  const todosCompletos = evals.every((e) => e.completo);
  const total = evals.reduce((s, e) => s + (e.completo ? e.subtotal : 0), 0);

  const desglose = useMemo(() => {
    const m: Record<string, { label: string; count: number; unit: number; sub: number }> = {};
    evals.forEach((e) => {
      if (!e.completo || !e.rango) return;
      const id = e.rango.id;
      if (!m[id]) m[id] = { label: e.rango.label, count: 0, unit: precioRango(precios, id), sub: 0 };
      m[id].count++;
      m[id].sub += precioRango(precios, id);
    });
    return RANGOS.map((r) => m[r.id]).filter(Boolean);
  }, [evals, precios]);

  const confirmable = haySeleccion && !cuposInsuficientes && todosCompletos && evals.some((e) => e.completo);

  const onConfirm = () => { setCodigo(codigoReserva()); setReservaEstado("pendiente"); setPayOpen(true); };
  const onResolve = (o: Outcome) => {
    setPayOpen(false);
    if (o === "success") { setReservaEstado("pagada"); setOkOpen(true); }
    else if (o === "cancel") { setReservaEstado("expirada"); setToast(true); }
    else { setReservaEstado("expirada"); setFailOpen(true); }
  };
  const onRetry = () => { setFailOpen(false); setReservaEstado("pendiente"); setPayOpen(true); };

  return (
    <div style={{ maxWidth: 1180, margin: "0 auto", padding: "22px 28px 90px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--fg-3)", fontSize: 13 }}>
        <Link href="/explorar" style={{ color: "var(--fg-3)", textDecoration: "none" }}>Explorar actividades</Link>
        <Crumb size={14} />
        <Link href={`/explorar/${a.id}`} style={{ color: "var(--fg-3)", textDecoration: "none" }}>{a.titulo}</Link>
        <Crumb size={14} />
        <span style={{ color: "var(--fg-2)", fontWeight: 500 }}>Reservar</span>
      </div>

      <div style={{ margin: "16px 0 26px" }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 30, color: "var(--fg-1)", margin: 0, letterSpacing: "-.01em" }}>Completá tu reserva</h1>
        <p style={{ margin: "6px 0 0", color: "var(--fg-2)", fontSize: 15 }}>Revisá la fecha, cargá a los visitantes y confirmá para asegurar tu lugar.</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 392px", gap: 40, alignItems: "start" }} className="reserva-grid">
        <div style={{ minWidth: 0, display: "flex", flexDirection: "column", gap: 36 }}>
          <section>
            <SectionHead n="1" title="Elegí el día" sub="Seleccioná una fecha disponible para la actividad." />
            <div className="card" style={{ padding: 22, display: "grid", gridTemplateColumns: "minmax(0,1fr) 250px", gap: 24, alignItems: "start" }}>
              <div style={{ background: "var(--cream-tert)", border: "1px solid var(--outline-variant)", borderRadius: 12, padding: 16 }} className="cal-wrap">
                <MonthCalendar
                  monthIdx={monthIdx}
                  selDay={selDay}
                  selMonthIdx={selMonthIdx}
                  onMonth={setMonthIdx}
                  onSelect={(d, mi) => { setSelDay(d); setSelMonthIdx(mi); }}
                />
              </div>
              <CuposPanel selLabel={selLabel} cupos={cupos} reservados={reservados} totalRows={totalRows} insuf={cuposInsuficientes} />
            </div>
          </section>

          <section>
            <SectionHead n="2" title="Visitantes" sub="El primer visitante viene autocompletado con tus datos. Editá lo que necesites y agregá más visitantes." />
            <TravelersList viajeros={viajeros} precios={precios} onChange={setViajeros} />
          </section>
        </div>

        <div style={{ position: "sticky", top: 88, display: "flex", flexDirection: "column", gap: 18 }} className="reserva-side">
          <InfoReserva a={a} precios={precios} />

          <div className="card" style={{ padding: 22 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <div className="t-label">Total de reserva</div>
              {reservaEstado && (
                <span style={{ display: "inline-flex", alignItems: "center", borderRadius: "var(--radius-pill)", padding: "3px 10px", fontSize: 11.5, fontWeight: 700, background: ESTADO_PILL[reservaEstado].bg, color: ESTADO_PILL[reservaEstado].fg }}>
                  {ESTADO_PILL[reservaEstado].label}
                </span>
              )}
            </div>

            {desglose.length > 0 ? (
              <div style={{ padding: "12px 14px", background: "var(--cream-tert)", borderRadius: 10 }}>
                {desglose.map((d) => (
                  <div key={d.label} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "var(--fg-2)", padding: "3px 0" }}>
                    <span>{d.count} × {d.label.toLowerCase()} <span style={{ color: "var(--fg-3)", fontSize: 11.5, fontFamily: "var(--font-mono)" }}>({d.unit > 0 ? moneyAr(d.unit) : "sin cargo"})</span></span>
                    <span style={{ fontFamily: "var(--font-mono)", color: "var(--fg-1)" }}>{moneyAr(d.sub)}</span>
                  </div>
                ))}
                <div style={{ borderTop: "1px solid var(--outline-variant)", marginTop: 10, paddingTop: 10, display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: "var(--fg-1)" }}>Total</span>
                  <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 23, color: "var(--green-800)" }}>{moneyAr(total)}</span>
                </div>
              </div>
            ) : (
              <div style={{ padding: 14, background: "var(--cream-tert)", borderRadius: 10, fontSize: 13, color: "var(--fg-3)", textAlign: "center" }}>
                Completá al menos un visitante para ver el total.
              </div>
            )}

            {cuposInsuficientes && (
              <div style={{ marginTop: 14, padding: "12px 14px", background: "var(--warning-fill)", border: "1px solid var(--warning)", borderRadius: 10, display: "flex", gap: 10, alignItems: "flex-start" }}>
                <AlertTriangle size={18} color="var(--warning-fg)" style={{ marginTop: 1, flexShrink: 0 }} />
                <div style={{ fontSize: 12.5, lineHeight: 1.45, color: "var(--fg-2)" }}>
                  <strong style={{ color: "var(--fg-1)" }}>No hay suficientes cupos</strong> para el día seleccionado. Para el {selLabel} quedan {cupos} lugares y estás reservando para {totalRows}. Reducí los viajeros o elegí otra fecha.
                </div>
              </div>
            )}

            <div style={{ marginTop: 14, padding: "12px 14px", background: "var(--green-050)", border: "1px solid var(--green-300)", borderRadius: 10, display: "flex", gap: 10, alignItems: "flex-start" }}>
              <ShieldCheck size={18} color="var(--green-800)" style={{ marginTop: 1, flexShrink: 0 }} />
              <div style={{ fontSize: 12.5, lineHeight: 1.5, color: "var(--fg-2)" }}>
                Podés realizar un reembolso total si cancelás con <strong style={{ color: "var(--green-800)" }}>3 o más días de anterioridad</strong> a la actividad.
              </div>
            </div>

            <button type="button" className="btn btn-primary btn-lg" style={{ width: "100%", justifyContent: "center", marginTop: 16 }} disabled={!confirmable} onClick={onConfirm}>
              <CalendarCheck size={20} /> Confirmar reserva
            </button>
            <p style={{ fontSize: 11.5, color: "var(--fg-3)", textAlign: "center", margin: "10px 0 0", lineHeight: 1.45 }}>
              Para pagar la reserva serás dirigido al servicio de pagos para realizar la transacción de manera segura.
            </p>
          </div>
        </div>
      </div>

      {payOpen && <PaymentSheet monto={total} actividad={a} fecha={selLabel} viajeros={totalRows} codigo={codigo} onResolve={onResolve} />}
      <SuccessModal open={okOpen} codigo={codigo} />
      <FailModal open={failOpen} onRetry={onRetry} onClose={() => setFailOpen(false)} />
      <CancelToast open={toast} onClose={() => setToast(false)} />

      <style>{`
        @media (max-width: 920px) {
          .reserva-grid { grid-template-columns: 1fr !important; }
          .reserva-side { position: static !important; }
        }
        @media (max-width: 560px) { .cal-wrap + div, .card .cal-wrap { } }
      `}</style>
    </div>
  );
}
