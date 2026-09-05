"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  MapPin, Star, Users, ShieldCheck, AlertTriangle, CalendarCheck,
  ChevronLeft, ChevronRight, ChevronRight as Crumb,
} from "lucide-react";
import { moneyAr } from "@/lib/format";
import { NOMBRES_DIA } from "@/data/actividad-detalle";
import {
  precioRango, evalViajero, fechaLabel,
  type Viajero, type InfoParaReservar,
} from "@/data/reserva";
import { useInfoParaReservar } from "@/hooks/useInfoParaReservar";
import { useReserva , type RealizarReservaRequest } from "@/hooks/useCheckout";
import AsyncBoundary from "@/components/AsyncBoundary";
import TravelersList from "./Travelers";
import { PaymentSheet, SuccessModal, FailModal, CancelToast } from "./PaymentSheet";
import type { MesCalendario } from "@/types/catalogo";

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
  meses, monthIdx, selDay, selMonthIdx, onMonth, onSelect,
}: {
  meses: MesCalendario[]; monthIdx: number; selDay: number | null; selMonthIdx: number | null;
  onMonth: (i: number) => void; onSelect: (day: number, mi: number) => void;
}) {
  const mes = meses[monthIdx];
  const firstDow = useMemo(() => (new Date(mes.year, mes.month, 1).getDay() + 6) % 7, [mes]);
  const daysInMonth = new Date(mes.year, mes.month + 1, 0).getDate();
  const cells: (number | null)[] = [...Array(firstDow).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <button type="button" onClick={() => onMonth(Math.max(0, monthIdx - 1))} disabled={monthIdx === 0} style={navBtn(monthIdx === 0)}><ChevronLeft size={17} /></button>
        <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 15.5, color: "var(--fg-1)" }}>{mes.label}</span>
        <button type="button" onClick={() => onMonth(Math.min(meses.length - 1, monthIdx + 1))} disabled={monthIdx === meses.length - 1} style={navBtn(monthIdx === meses.length - 1)}><ChevronRight size={17} /></button>
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

function CuposPanel({ selLabel, cupos, reservados, totalRows, insuf, cupoMaximo }: { selLabel: string | null; cupos: number; reservados: number; totalRows: number; insuf: boolean; cupoMaximo: number }) {
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
        <span style={{ fontSize: 13, color: "var(--fg-3)" }}>de {cupoMaximo} lugares</span>
      </div>
      <div style={{ fontSize: 12, color: "var(--fg-3)", marginBottom: 12 }}>{reservados} ya reservados</div>
      <div style={{ height: 7, borderRadius: 4, background: "var(--cream-tert)", overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${(cupos / cupoMaximo) * 100}%`, background: barColor, borderRadius: 4 }} />
      </div>
      <div style={{ marginTop: 12, padding: "8px 10px", borderRadius: 8, background: insuf ? "var(--danger-fill)" : "var(--cream-tert)", fontSize: 12, fontWeight: 600, color: insuf ? "var(--danger-fg)" : "var(--fg-2)", display: "flex", alignItems: "center", gap: 7 }}>
        <Users size={14} color={insuf ? "var(--danger)" : "var(--fg-2)"} />
        {totalRows} {totalRows === 1 ? "visitante" : "visitantes"} en la reserva
      </div>
    </div>
  );
}

function InfoReserva({ info }: { info: InfoParaReservar }) {
  return (
    <div className="card" style={{ padding: 22 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, marginBottom: 16 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "var(--fg-1)", lineHeight: 1.3 }}>{info.nombre}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 5, fontSize: 13, color: "var(--fg-2)" }}>
            <MapPin size={14} color="var(--brown-700)" /> {info.nombreEstablecimiento} · {info.ubicacion}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", background: "var(--cream-tert)", borderRadius: 999, fontSize: 12.5, fontWeight: 600, flexShrink: 0 }}>
          <Star size={13} color="#C9A227" fill="#C9A227" /> {info.calificacionPromedio.toFixed(1)}
        </div>
      </div>

      <div style={{ display: "flex", gap: 16, padding: "12px 14px", background: "var(--green-050)", border: "1px solid var(--green-300)", borderRadius: 10, marginBottom: 18 }}>
        <Meta icon={<Users size={16} color="var(--green-800)" />} label="Cupo máximo" value={`${info.cupoMaximo} personas`} />
      </div>

      <div className="t-label" style={{ marginBottom: 10 }}>Precio por rango etario</div>
      <div>
        {info.rangos.map((r, i) => {
          const p = precioRango(info.precios, r.id);
          return (
            <div key={r.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderTop: i === 0 ? "none" : "1px solid var(--cream-tert)" }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--fg-1)" }}>{r.label}</div>
                <div style={{ fontSize: 12, color: "var(--fg-3)" }}>{r.sub}</div>
              </div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 14.5, fontWeight: 600, color: p > 0 ? "var(--fg-1)" : "var(--green-800)" }}>
                {p > 0 ? moneyAr(p) : "Sin cargo"}
              </div>
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

export default function ReservaClient({ id }: { id: string }) {
  const { data: info, isLoading, error, reload } = useInfoParaReservar(id);
  return (
    <AsyncBoundary loading={isLoading} error={error} onRetry={reload} pad={160}>
      {info && <ReservaForm id={id} info={info} />}
    </AsyncBoundary>
  );
}

function ReservaForm({ id, info }: { id: string; info: InfoParaReservar }) {
  const { calendario, rangos, precios } = info;

  const [monthIdx, setMonthIdx] = useState(0);
  const [selDay, setSelDay] = useState<number | null>(null);
  const [selMonthIdx, setSelMonthIdx] = useState<number | null>(null);
  const [viajeros, setViajeros] = useState<Viajero[]>([{ ...info.titular }]);

  const [codigo, setCodigo] = useState<string | null>(null);
  const [payOpen, setPayOpen] = useState(false);
  const [okOpen, setOkOpen] = useState(false);
  const [failOpen, setFailOpen] = useState(false);
  const [toast, setToast] = useState(false);

  const [preferenceId, setPreferenceId] = useState<string>("");

  const selCal = selMonthIdx != null ? calendario[selMonthIdx] : null;
  const selData = selCal && selDay ? selCal.days[selDay] : null;
  const haySeleccion = !!(selData && selData.state === "disponible");
  const cupos = haySeleccion ? selData!.cupos : 0;
  const cupoMaximoDia = haySeleccion ? selData!.cupoMaximo : 0;
  const reservados = haySeleccion ? Math.max(0, cupoMaximoDia - cupos) : 0;
  const selLabel = haySeleccion && selCal && selDay ? fechaLabel(selCal, selDay) : null;

  const evals = useMemo(() => viajeros.map((v) => evalViajero(v, precios, rangos)), [viajeros, precios, rangos]);
  const totalRows = viajeros.length;
  const cuposInsuficientes = haySeleccion && totalRows > cupos;
  const todosCompletos = evals.every((e) => e.completo);
  const total = evals.reduce((s, e) => s + (e.completo ? e.subtotal : 0), 0);

  const desglose = useMemo(() => {
    const m: Record<string, { label: string; count: number; unit: number; sub: number }> = {};
    evals.forEach((e) => {
      if (!e.completo || !e.rango) return;
      const rid = e.rango.id;
      if (!m[rid]) m[rid] = { label: e.rango.label, count: 0, unit: precioRango(precios, rid), sub: 0 };
      m[rid].count++;
      m[rid].sub += precioRango(precios, rid);
    });
    return rangos.map((r) => m[r.id]).filter(Boolean);
  }, [evals, precios, rangos]);

  const { crear, useCancelarPago , isLoading: creando } = useReserva();
  const confirmable = haySeleccion && !cuposInsuficientes && todosCompletos && evals.some((e) => e.completo);

  const onConfirm = async () => {
    if (!selData) return;
    const request: RealizarReservaRequest = {
      diaActividadId: selData.id,
      reservaDetalleList: viajeros.map((v) => ({
        nombreApellido: v.nombre,
        identificacion: v.numDoc,
        tipoIdentificacion: v.tipoDoc,
        fechaNacimiento: v.fechaNac,
      })),
    };
    const res = await crear(request);
    setPreferenceId(res.data?.preferenceId ?? "");
    if (!res.ok || !res.data) return;
    setCodigo(res.data.reservaDTO.idReserva);
    setPayOpen(true);
  };
  const onResolve = (prefId: String) => {
    if(prefId==""){
      setPayOpen(false);
      setOkOpen(true);
      return;
    };
    useCancelarPago(prefId);
    setPayOpen(false);
  };
  
  const onRetry = () => { setFailOpen(false); setPayOpen(true); };

  return (
    <div style={{ maxWidth: 1180, margin: "0 auto", padding: "22px 28px 90px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--fg-3)", fontSize: 13 }}>
        <Link href="/explorar" style={{ color: "var(--fg-3)", textDecoration: "none" }}>Explorar actividades</Link>
        <Crumb size={14} />
        <Link href={`/explorar/${id}`} style={{ color: "var(--fg-3)", textDecoration: "none" }}>{info.nombre}</Link>
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
                {calendario.length > 0 ? (
                  <MonthCalendar
                    meses={calendario}
                    monthIdx={monthIdx}
                    selDay={selDay}
                    selMonthIdx={selMonthIdx}
                    onMonth={setMonthIdx}
                    onSelect={(d, mi) => { setSelDay(d); setSelMonthIdx(mi); }}
                  />
                ) : (
                  <div style={{ padding: "16px 4px", fontSize: 13.5, color: "var(--fg-3)", textAlign: "center" }}>
                    Todavía no hay fechas disponibles para esta actividad.
                  </div>
                )}
              </div>
              <CuposPanel selLabel={selLabel} cupos={cupos} reservados={reservados} totalRows={totalRows} insuf={cuposInsuficientes} cupoMaximo={cupoMaximoDia} />
            </div>
          </section>

          <section>
            <SectionHead n="2" title="Visitantes" sub="El primer visitante viene autocompletado con tus datos. Editá lo que necesites y agregá más visitantes." />
            <TravelersList viajeros={viajeros} precios={precios} rangos={rangos} onChange={setViajeros} />
          </section>
        </div>

        <div style={{ position: "sticky", top: 88, display: "flex", flexDirection: "column", gap: 18 }} className="reserva-side">
          <InfoReserva info={info} />

          <div className="card" style={{ padding: 22 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <div className="t-label">Total de reserva</div>
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
                Podés realizar un reembolso total si cancelás con <strong style={{ color: "var(--green-800)" }}>{info.diasMinReembolso} {info.diasMinReembolso === 1 ? "día" : "días"} o más</strong> de anterioridad a la actividad.
              </div>
            </div>

            <button type="button" className="btn btn-primary btn-lg" style={{ width: "100%", justifyContent: "center", marginTop: 16 }} disabled={!confirmable || creando} onClick={onConfirm}>
              {creando ? "Procesando…" : (<><CalendarCheck size={20} /> Confirmar reserva</>)}
            </button>
            <p style={{ fontSize: 11.5, color: "var(--fg-3)", textAlign: "center", margin: "10px 0 0", lineHeight: 1.45 }}>
              Para pagar la reserva serás dirigido al servicio de pagos para realizar la transacción de manera segura.
            </p>
          </div>
        </div>
      </div>

      {payOpen && (
        <PaymentSheet
          monto={total}
          actividad={{ titulo: info.nombre, finca: info.nombreEstablecimiento, loc: info.ubicacion }}
          fecha={selLabel}
          viajeros={totalRows}
          codigo={codigo}
          onResolve={onResolve}
          preferenceId={preferenceId}
        />
      )}
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
