"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  MapPin, Star, Users, ShieldCheck, AlertTriangle, CalendarCheck, CalendarX, Lock,
  ChevronRight as Crumb,
} from "lucide-react";
import { moneyAr } from "@/lib/format";
import {
  precioRango, evalViajero, fechaLabel,
  type Viajero, type InfoParaReservar,
} from "@/data/reserva";
import { refrescarCalendario, useInfoParaReservar } from "@/hooks/useInfoParaReservar";
import { useReserva , type RealizarReservaRequest } from "@/hooks/useCheckout";
import AsyncBoundary from "@/components/AsyncBoundary";
import TravelersList from "./Travelers";
import { SuccessModal, CancelToast } from "./Resultados";
import { AvisoBloqueado, BloqueoCupos, type EstadoBloqueo } from "./Bloqueo";
import { Alert, EstadoBadge } from "@/components/ui";
import { cn } from "@/lib/utils";
import { CalendarioReserva, type DiaSeleccionado } from "@/components/reserva/CalendarioReserva";
import { buscarDia, primerMesDisponible } from "@/lib/calendarioReserva";

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

/** `mios`: los cupos ya están retenidos para esta reserva. */
function CuposPanel({ selLabel, cupos, reservados, totalRows, insuf, cupoMaximo, mios }: { selLabel: string | null; cupos: number; reservados: number; totalRows: number; insuf: boolean; cupoMaximo: number; mios: boolean }) {
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
      <div className={cn(
        "mt-3 flex items-center gap-[7px] rounded-md px-2.5 py-2 text-xs font-semibold",
        insuf ? "bg-danger-fill text-danger-fg" : mios ? "border border-green-300 bg-green-050 text-green-800" : "bg-cream-tert text-fg-2",
      )}>
        {mios ? <Lock size={14} aria-hidden /> : <Users size={14} aria-hidden />}
        {mios
          ? `Reservados por vos: ${totalRows}`
          : `${totalRows} ${totalRows === 1 ? "visitante" : "visitantes"} en la reserva`}
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

/** Tope de filas que se arman desde la query: un link editado a mano no debería colgar la pantalla. */
const MAX_VISITANTES_QUERY = 50;

/**
 * `diaInicial` y `visitantesIniciales` vienen de la query que arma el widget del
 * detalle (`?dia=…&visitantes=…`). Son una sugerencia: si el día ya no está o se
 * quedó sin cupo, la pantalla arranca sin fecha elegida como si no vinieran.
 */
export default function ReservaClient({ id, diaInicial = "", visitantesIniciales = 1 }: {
  id: string;
  diaInicial?: string;
  visitantesIniciales?: number;
}) {
  const { data: info, isLoading, error, reload } = useInfoParaReservar(id);
  return (
    <AsyncBoundary loading={isLoading} error={error} onRetry={reload} pad={160}>
      {info && <ReservaForm id={id} info={info} diaInicial={diaInicial} visitantesIniciales={visitantesIniciales} />}
    </AsyncBoundary>
  );
}

/** El primero es el titular, autocompletado; el resto arranca vacío. */
function viajerosIniciales(titular: Viajero, cantidad: number): Viajero[] {
  const n = Math.min(MAX_VISITANTES_QUERY, Math.max(1, Math.floor(cantidad) || 1));
  const vacio: Viajero = { nombre: "", fechaNac: "", tipoDoc: "DNI", numDoc: "" };
  return [{ ...titular }, ...Array.from({ length: n - 1 }, () => ({ ...vacio }))];
}

function ReservaForm({ id, info, diaInicial, visitantesIniciales }: {
  id: string;
  info: InfoParaReservar;
  diaInicial: string;
  visitantesIniciales: number;
}) {
  const { rangos, precios } = info;
  // Copia propia del calendario: se reemplaza cuando la fecha elegida se llena
  // al confirmar, sin volver a montar la pantalla.
  const [calendario, setCalendario] = useState(info.calendario);
  const seccionDia = useRef<HTMLElement>(null);

  const [sel, setSel] = useState<DiaSeleccionado | null>(() => {
    const d = buscarDia(calendario, diaInicial);
    return d && calendario[d.monthIdx].days[d.day].state === "disponible" ? d : null;
  });
  const [monthIdx, setMonthIdx] = useState(() => sel?.monthIdx ?? primerMesDisponible(calendario));
  const [viajeros, setViajeros] = useState<Viajero[]>(() => viajerosIniciales(info.titular, visitantesIniciales));
  const selDay = sel?.day ?? null;
  const selMonthIdx = sel?.monthIdx ?? null;

  const [bloqueo, setBloqueo] = useState<EstadoBloqueo>({ estado: "libre" });
  const [errorReserva, setErrorReserva] = useState<string | null>(null);
  const [okOpen, setOkOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [cancelando, setCancelando] = useState(false);

  // El aviso de fecha sin cupos queda hasta que se elige otra.
  const elegirDia = (d: DiaSeleccionado) => {
    setSel(d);
    setBloqueo((b) => (b.estado === "conflicto" ? { estado: "libre" } : b));
  };

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

  const { crear, cancelarPago, isLoading: creando } = useReserva();
  const confirmable = haySeleccion && !cuposInsuficientes && todosCompletos && evals.some((e) => e.completo);
  // Con los cupos retenidos (o ya pagados) la fecha y los visitantes no se tocan.
  const bloqueado = bloqueo.estado === "retenida" || bloqueo.estado === "pagada" || creando;
  const mios = bloqueo.estado === "retenida" || bloqueo.estado === "pagada";

  const estadoPill =
    bloqueo.estado === "retenida" ? { tone: "warning" as const, texto: "Pendiente de pago" } :
    bloqueo.estado === "pagada" ? { tone: "success" as const, texto: "Pagada" } :
    null;

  /** Crea la reserva en "Pendiente": eso es lo que retiene los cupos. */
  const onConfirm = async () => {
    if (!selData) return;
    setErrorReserva(null);
    const request: RealizarReservaRequest = {
      diaActividadId: selData.id,
      reservaDetalleList: viajeros.map((v) => ({
        nombreApellido: v.nombre,
        identificacion: v.numDoc,
        tipoIdentificacion: v.tipoDoc,
        fechaNacimiento: v.fechaNac,
      })),
    };
    try {
      const res = await crear(request);
      if (!res.ok || !res.data) {
        if (res.code === "Actividad.FULL") await fechaSinCupos();
        else setErrorReserva("No pudimos reservar tus cupos. Probá de nuevo en un rato.");
        return;
      }
      const codigo = res.data.reservaDTO.idReserva;
      // Sin preferencia el pago no pasa por Mercado Pago y ya quedó aprobado.
      setBloqueo(res.data.preferenceId
        ? { estado: "retenida", codigo, preferenceId: res.data.preferenceId }
        : { estado: "pagada", codigo });
    } catch {
      setErrorReserva("No pudimos reservar tus cupos. Probá de nuevo en un rato.");
    }
  };

  /**
   * Otro visitante tomó los cupos entre que se eligió la fecha y se confirmó:
   * se trae la disponibilidad nueva, se deselecciona la fecha y se lleva al
   * visitante al calendario para que elija otra. Si la recarga falla queda el
   * calendario viejo, pero igual sin esa fecha elegida.
   */
  const fechaSinCupos = async () => {
    setBloqueo({ estado: "conflicto", fecha: selLabel ?? "día elegido" });
    setSel(null);
    const nuevo = await refrescarCalendario(id);
    if (nuevo) {
      setCalendario(nuevo);
      // Los meses pueden ser otros (p. ej. si ese era el último día del mes).
      setMonthIdx((i) => (nuevo.length === 0 ? 0 : Math.min(i, nuevo.length - 1)));
    }
    seccionDia.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  /** Pasa la reserva a "Expirada" en el backend, que libera los cupos. */
  const liberar = async (mensaje: string) => {
    if (bloqueo.estado !== "retenida") return;
    setCancelando(true);
    try {
      const res = await cancelarPago(bloqueo.preferenceId);
      if (!res.ok) {
        setToast("No pudimos liberar los cupos. Probá de nuevo.");
        return;
      }
      setBloqueo({ estado: "libre" });
      setToast(mensaje);
    } catch {
      setToast("No pudimos liberar los cupos. Probá de nuevo.");
    } finally {
      setCancelando(false);
    }
  };

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

      <div className="grid grid-cols-1 items-start gap-7 shell:grid-cols-[minmax(0,1fr)_392px] shell:gap-10">
        <div className="flex min-w-0 flex-col gap-9">
          {bloqueo.estado === "retenida" && (
            <AvisoBloqueado
              cancelando={cancelando}
              onEditar={() => liberar("Liberaste los cupos. Ya podés editar la reserva.")}
            />
          )}
          {/* `inert` saca la columna del foco y de los clicks mientras está bloqueada. */}
          <div inert={bloqueado} className={cn("flex flex-col gap-9 transition-opacity duration-200", bloqueado && "opacity-55")}>
            <section ref={seccionDia} className="scroll-mt-24">
              <SectionHead n="1" title="Elegí el día" sub="Seleccioná una fecha disponible para la actividad." />
              <div className="card grid grid-cols-1 items-start gap-6 p-[22px] sm:grid-cols-[minmax(0,1fr)_250px]">
                {/* Abajo del calendario y a lo ancho de la tarjeta: es ahí donde hay que elegir otra fecha. */}
                {bloqueo.estado === "conflicto" && (
                  <div role="alert" className="flex items-start gap-2.5 rounded-[10px] border border-danger bg-danger-fill px-3.5 py-3 sm:col-span-2">
                    <CalendarX size={18} className="mt-px shrink-0 text-danger" aria-hidden />
                    <div className="text-[13px] leading-[1.45] text-fg-2">
                      <strong className="text-danger-fg">El {bloqueo.fecha} se quedó sin cupos.</strong> Otra persona
                      reservó antes que vos. Actualizamos el calendario: elegí otra fecha.
                    </div>
                  </div>
                )}
                <div className="rounded-xl border border-outline-variant bg-cream-tert p-4">
                  {calendario.length > 0 ? (
                    <CalendarioReserva
                      meses={calendario}
                      monthIdx={monthIdx}
                      onMonth={setMonthIdx}
                      seleccionado={sel}
                      onSelect={elegirDia}
                      leyenda={false}
                    />
                  ) : (
                    <div className="px-1 py-4 text-center text-[13.5px] text-fg-3">
                      Todavía no hay fechas disponibles para esta actividad.
                    </div>
                  )}
                </div>
                <CuposPanel selLabel={selLabel} cupos={cupos} reservados={reservados} totalRows={totalRows} insuf={cuposInsuficientes} cupoMaximo={cupoMaximoDia} mios={mios} />
              </div>
            </section>

            <section>
              <SectionHead n="2" title="Visitantes" sub="El primer visitante viene autocompletado con tus datos. Editá lo que necesites y agregá más visitantes." />
              <TravelersList viajeros={viajeros} precios={precios} rangos={rangos} onChange={setViajeros} />
            </section>
          </div>
        </div>

        <div className="flex flex-col gap-[18px]">
          <InfoReserva info={info} />

          <div className="card" style={{ padding: 22 }}>
            <div className="mb-3 flex items-center justify-between gap-2">
              <div className="t-label">Total de reserva</div>
              {estadoPill && <EstadoBadge tone={estadoPill.tone} className="text-[11.5px]">{estadoPill.texto}</EstadoBadge>}
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

            {cuposInsuficientes && !mios && (
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

            {errorReserva && <Alert className="mt-3.5">{errorReserva}</Alert>}

            <BloqueoCupos
              bloqueo={bloqueo}
              confirmando={creando}
              cancelando={cancelando}
              confirmable={confirmable}
              fecha={selLabel}
              visitantes={totalRows}
              onConfirmar={onConfirm}
              onPagar={() => setOkOpen(true)}
              onCancelar={() => liberar("Cancelaste la reserva. Los cupos se liberaron.")}
            />
          </div>
        </div>
      </div>

      <SuccessModal open={okOpen} onClose={() => setOkOpen(false)} />
      <CancelToast open={toast !== null} message={toast ?? ""} onClose={() => setToast(null)} />
    </div>
  );
}
