"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, CalendarCheck, CalendarDays, CalendarOff, CalendarX, Info, Minus, Plus, Star, Users } from "lucide-react";
import { Button, buttonClasses } from "@/components/ui";
import { Sheet, SheetBody, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { CalendarioReserva, type DiaSeleccionado } from "@/components/reserva/CalendarioReserva";
import { primerMesDisponible } from "@/lib/calendarioReserva";
import { fechaLabel } from "@/data/reserva";
import { fmtPuntaje, moneyAr } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ActividadPublica, TarifaActividad } from "@/types/catalogo";

/** Con 3 lugares o menos el número de cupos se pinta de advertencia. */
const POCOS_CUPOS = 3;

/** El `--breakpoint-shell` de `globals.css`: desde ahí el widget es la tarjeta lateral. */
const BREAKPOINT_SHELL = 1000;

/** El rango abierto por arriba se lee mejor como "18 años o más". */
function rangoEtario(t: TarifaActividad): string {
  return t.edadMaxima >= 120 ? `${t.edadMinima} años o más` : `${t.edadMinima} a ${t.edadMaxima} años`;
}

const claveTarifa = (t: TarifaActividad) => t.id || t.nombre;

/** Arranca con una persona en la tarifa base, que es la que se publica como "desde". */
function visitantesIniciales(tarifas: TarifaActividad[]): Record<string, number> {
  const base = tarifas.find((t) => t.esBase) ?? tarifas[0];
  return Object.fromEntries(tarifas.map((t) => [claveTarifa(t), t === base ? 1 : 0]));
}

/**
 * Estado del widget: día elegido, mes visible y visitantes por tarifa, con todo
 * lo que se deriva. Vive arriba de todo para que el panel de escritorio, la
 * hoja de móvil y su barra fija compartan la misma selección —si se achica la
 * ventana con un día elegido, sigue elegido—.
 */
function useEstadoReserva(a: ActividadPublica) {
  const meses = a.calendario;
  const [monthIdx, setMonthIdx] = useState(() => primerMesDisponible(meses));
  const [sel, setSel] = useState<DiaSeleccionado | null>(null);
  const [visitantes, setVisitantes] = useState(() => visitantesIniciales(a.tarifas));

  const mesSel = sel ? meses[sel.monthIdx] : null;
  const dia = mesSel && sel ? mesSel.days[sel.day] : null;
  const haySeleccion = dia?.state === "disponible";
  const cupos = haySeleccion ? dia.cupos : 0;
  const cupoMaximo = haySeleccion ? dia.cupoMaximo : 0;
  const fecha = haySeleccion && mesSel && sel ? fechaLabel(mesSel, sel.day) : null;

  const totalVisitantes = a.tarifas.reduce((s, t) => s + (visitantes[claveTarifa(t)] ?? 0), 0);
  const total = a.tarifas.reduce((s, t) => s + t.precio * (visitantes[claveTarifa(t)] ?? 0), 0);
  // Con los steppers topeados sólo se excede al pasar a un día con menos cupos.
  const excede = haySeleccion && totalVisitantes > cupos;

  // Sin tarifas cargadas no hay contadores: se pasa a `/reservar` con una persona.
  const reservable = haySeleccion && !excede && (totalVisitantes > 0 || a.tarifas.length === 0);
  const hrefReserva = haySeleccion
    ? `/explorar/${a.id}/reservar?${new URLSearchParams({ dia: dia.id, visitantes: String(Math.max(1, totalVisitantes)) })}`
    : "";

  return {
    meses, monthIdx, setMonthIdx, sel, setSel, visitantes, setVisitantes,
    haySeleccion, cupos, cupoMaximo, fecha, totalVisitantes, total, excede, reservable, hrefReserva,
  };
}

type EstadoReserva = ReturnType<typeof useEstadoReserva>;

/**
 * Widget de reserva del detalle: precio, calendario con la disponibilidad que
 * trae `GET /actividades/{id}`, cuántos visitantes por tarifa y el total.
 *
 * Desde `shell:` es una tarjeta en la columna derecha. Más angosto, como pide
 * el diseño, queda una barra fija abajo con el "desde" (o el total, si ya hay
 * algo elegido) y el panel entero se abre en una hoja.
 *
 * Desde acá no se reserva: "Reservar ahora" lleva a `/reservar` con el día y la
 * cantidad de visitantes en la query, y allá se cargan los datos de cada uno
 * —la tarifa real sale de la fecha de nacimiento, no de estos contadores—.
 *
 * Si el establecimiento no admite reservas (`admiteReservas`, hoy: sin cuenta
 * de Mercado Pago utilizable) el calendario se reemplaza por un aviso y la
 * barra de móvil no ofrece fechas.
 */
export default function BookingWidget({ a, className }: { a: ActividadPublica; className?: string }) {
  const r = useEstadoReserva(a);
  const [hojaAbierta, setHojaAbierta] = useState(false);

  // Si la ventana se agranda hasta `shell:` con la hoja abierta, se cierra: la
  // hoja se oculta por CSS, pero el fondo y el bloqueo de scroll quedarían.
  useEffect(() => {
    const mq = window.matchMedia(`(min-width: ${BREAKPOINT_SHELL}px)`);
    const alCambiar = () => { if (mq.matches) setHojaAbierta(false); };
    mq.addEventListener("change", alCambiar);
    return () => mq.removeEventListener("change", alCambiar);
  }, []);

  return (
    <>
      <aside className={cn("hidden rounded-lg border border-outline-variant bg-surface p-[22px] shell:block", className)}>
        <PanelReserva a={a} r={r} />
      </aside>

      <div className="fixed inset-x-0 bottom-0 z-[60] flex items-center justify-between gap-3 border-t border-outline-variant bg-surface px-4 pt-3 pb-[calc(12px+env(safe-area-inset-bottom))] shadow-[0_-4px_12px_rgba(45,90,39,.08)] shell:hidden">
        <div className="min-w-0">
          {r.reservable ? (
            <>
              <div className="font-mono text-[19px] font-bold text-green-800">{moneyAr(r.total)}</div>
              <div className="mt-px truncate text-[12.5px] text-fg-2">
                {r.fecha} · {r.totalVisitantes} {r.totalVisitantes === 1 ? "visitante" : "visitantes"}
              </div>
            </>
          ) : (
            <PrecioDesde a={a} compacto />
          )}
        </div>
        {a.admiteReservas ? (
          <Button onClick={() => setHojaAbierta(true)} className="min-h-11 shrink-0">
            <CalendarDays size={18} aria-hidden /> {r.reservable ? "Continuar" : "Ver fechas"}
          </Button>
        ) : (
          <span className="flex max-w-[55%] items-center gap-1.5 text-right text-[12.5px] leading-[1.35] text-fg-2">
            <CalendarOff size={16} className="shrink-0 text-fg-3" aria-hidden />
            Sin reservas por el momento
          </span>
        )}
      </div>

      <Sheet open={hojaAbierta} onOpenChange={setHojaAbierta}>
        <SheetContent className="shell:hidden">
          <SheetHeader>
            <SheetTitle>Reservá tu lugar</SheetTitle>
          </SheetHeader>
          <SheetBody className="p-4">
            <PanelReserva a={a} r={r} tactil />
          </SheetBody>
        </SheetContent>
      </Sheet>
    </>
  );
}

/** "Desde $ X / persona", o "A consultar" si la actividad no tiene precio publicado. */
function PrecioDesde({ a, compacto = false }: { a: ActividadPublica; compacto?: boolean }) {
  return (
    <div>
      <div className={cn("font-semibold uppercase tracking-[.06em] text-fg-3", compacto ? "text-[11px]" : "text-[11.5px]")}>Desde</div>
      {a.precioRegular === null ? (
        <div className={cn("font-display font-bold text-fg-3", compacto ? "text-[17px]" : "mt-0.5 text-[22px]")}>A consultar</div>
      ) : (
        <div className={cn("flex items-baseline gap-1.5", !compacto && "mt-0.5")}>
          <span className={cn("font-mono text-green-800", compacto ? "text-[19px] font-bold" : "text-[26px] font-semibold")}>
            {moneyAr(a.precioRegular)}
          </span>
          <span className={cn("text-fg-3", compacto ? "text-xs" : "text-[12.5px]")}>/ persona</span>
        </div>
      )}
    </div>
  );
}

/** El contenido del widget. `tactil` agranda los blancos para la hoja de móvil. */
function PanelReserva({ a, r, tactil = false }: { a: ActividadPublica; r: EstadoReserva; tactil?: boolean }) {
  const {
    meses, monthIdx, setMonthIdx, sel, setSel, visitantes, setVisitantes,
    haySeleccion, cupos, cupoMaximo, fecha, totalVisitantes, total, excede, reservable, hrefReserva,
  } = r;
  const reservados = Math.max(0, cupoMaximo - cupos);
  const restantes = Math.max(0, cupos - totalVisitantes);
  const completo = haySeleccion && totalVisitantes > 0 && totalVisitantes === cupos;

  return (
    <>
      <div className="mb-3.5 flex items-start justify-between gap-2.5">
        <PrecioDesde a={a} />
        {a.resenias.promedio !== null && (
          <div
            className="flex shrink-0 items-center gap-[5px] rounded-full bg-cream-tert px-2.5 py-[5px] text-[12.5px] font-semibold text-fg-1"
            aria-label={`${fmtPuntaje(a.resenias.promedio)} de 5, ${a.resenias.total} ${a.resenias.total === 1 ? "reseña" : "reseñas"}`}
          >
            <Star size={13} className="fill-star text-star" aria-hidden />
            {fmtPuntaje(a.resenias.promedio)}
            <span className="font-medium text-fg-3">· {a.resenias.total}</span>
          </div>
        )}
      </div>

      {!a.admiteReservas ? (
        <SinReservas />
      ) : (
        <>
          <div className="t-label mb-2.5">Elegí una fecha</div>

          {meses.length === 0 ? (
            <div className="flex items-start gap-2.5 rounded-md border border-dashed border-sand bg-cream-tert p-4 text-[13px] text-fg-2">
              <CalendarX size={18} className="mt-px shrink-0 text-fg-3" aria-hidden />
              <div>
                <div className="mb-0.5 font-semibold text-fg-1">Todavía no hay fechas</div>
                <div className="leading-[1.4]">El establecimiento no publicó días para esta actividad. Escribiles para consultar.</div>
              </div>
            </div>
          ) : (
            <>
              <div className={cn("mb-[18px] rounded-xl border border-outline-variant bg-cream-tert", tactil ? "p-2.5" : "p-3.5")}>
                <CalendarioReserva
                  tactil={tactil}
                  meses={meses}
                  monthIdx={monthIdx}
                  onMonth={setMonthIdx}
                  seleccionado={sel}
                  onSelect={setSel}
                />
              </div>

              {!haySeleccion ? (
                <div className="flex items-start gap-2.5 rounded-[10px] border border-green-300 bg-green-050 px-3.5 py-4 text-[13px] text-green-800">
                  <CalendarCheck size={18} className="shrink-0" aria-hidden />
                  <div>
                    <div className="mb-0.5 font-semibold">Elegí un día disponible</div>
                    <div className="leading-[1.4] text-fg-2">
                      Seleccioná una fecha en el calendario para ver los cupos disponibles y completar tu reserva.
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="mb-4 flex items-center justify-between gap-3 rounded-[10px] border border-green-300 bg-green-050 px-3.5 py-3">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <CalendarCheck size={17} className="shrink-0 text-green-800" aria-hidden />
                      <div className="min-w-0">
                        <div className="text-[13.5px] font-semibold text-fg-1">{fecha}</div>
                        <div className="mt-px text-[11.5px] text-fg-2">Fecha seleccionada</div>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="text-[10.5px] font-semibold uppercase tracking-[.06em] text-fg-3">Cupos disponibles</div>
                      <div className={cn("flex items-center justify-end gap-1.5 font-mono text-[15px] font-bold", cupos <= POCOS_CUPOS ? "text-warning" : "text-green-800")}>
                        <Users size={13} aria-hidden /> {cupos} / {cupoMaximo}
                      </div>
                      <div className="mt-px text-[10.5px] text-fg-3">{reservados} reservados</div>
                    </div>
                  </div>

                  <div className="mb-1 flex items-center justify-between">
                    <div className="t-label">¿Cuántos visitantes?</div>
                    {totalVisitantes > 0 && !excede && (
                      <div className="font-mono text-[11.5px] text-fg-3">{totalVisitantes} / {cupos}</div>
                    )}
                  </div>
                  <div className="mt-2 border-t border-cream-tert">
                    {a.tarifas.map((t) => {
                      const k = claveTarifa(t);
                      return (
                        <Stepper
                          key={k}
                          tarifa={t}
                          valor={visitantes[k] ?? 0}
                          puedeSumar={restantes > 0}
                          tactil={tactil}
                          onChange={(v) => setVisitantes((p) => ({ ...p, [k]: v }))}
                        />
                      );
                    })}
                  </div>

                  {excede && (
                    <div className="mt-3.5 flex items-start gap-2.5 rounded-[10px] border border-warning bg-warning-fill px-3.5 py-3 text-[13px] leading-[1.45]">
                      <AlertTriangle size={18} className="mt-px shrink-0 text-warning" aria-hidden />
                      <div>
                        <div className="font-semibold text-fg-1">Superás los cupos disponibles</div>
                        <div className="mt-0.5 text-fg-2">
                          Para el {fecha} quedan <strong>{cupos} {cupos === 1 ? "lugar" : "lugares"}</strong> y estás
                          reservando para {totalVisitantes}. Reducí la cantidad o elegí otra fecha.
                        </div>
                      </div>
                    </div>
                  )}

                  {completo && (
                    <div className="mt-3.5 flex items-start gap-2.5 rounded-[10px] border border-warning bg-warning-fill px-3.5 py-3 text-[13px] leading-[1.45]">
                      <Info size={18} className="mt-px shrink-0 text-warning-fg" aria-hidden />
                      <div>
                        <div className="font-semibold text-fg-1">Alcanzaste el límite de cupos</div>
                        <div className="mt-0.5 text-fg-2">
                          Para el {fecha} quedan <strong>{cupos} {cupos === 1 ? "lugar" : "lugares"}</strong> y ya los
                          completaste. No podés agregar más visitantes para esta fecha.
                        </div>
                      </div>
                    </div>
                  )}

                  {totalVisitantes > 0 && !excede && (
                    <div className="mt-4 rounded-[10px] bg-cream-tert p-3.5">
                      {a.tarifas.filter((t) => (visitantes[claveTarifa(t)] ?? 0) > 0).map((t) => {
                        const n = visitantes[claveTarifa(t)];
                        return (
                          <div key={claveTarifa(t)} className="flex justify-between gap-3 py-[3px] text-[13px] text-fg-2">
                            <span>
                              {n} × {t.nombre.toLowerCase()}{" "}
                              <span className="font-mono text-[11.5px] text-fg-3">({t.precio > 0 ? moneyAr(t.precio) : "sin cargo"})</span>
                            </span>
                            <span className="font-mono text-fg-1">{moneyAr(t.precio * n)}</span>
                          </div>
                        );
                      })}
                      <div className="mt-2.5 flex items-baseline justify-between border-t border-outline-variant pt-2.5">
                        <span className="text-sm font-semibold text-fg-1">Total</span>
                        <span className="font-mono text-[22px] font-bold text-green-800">{moneyAr(total)}</span>
                      </div>
                    </div>
                  )}

                  {reservable ? (
                    <Link href={hrefReserva} className={buttonClasses({ size: "lg", className: "mt-4 w-full" })}>
                      <CalendarCheck size={20} aria-hidden /> Reservar ahora
                    </Link>
                  ) : (
                    <Button size="lg" disabled className="mt-4 w-full">
                      <CalendarCheck size={20} aria-hidden /> Reservar ahora
                    </Button>
                  )}
                  <p className="mt-2.5 text-center text-[11.5px] leading-[1.4] text-fg-3">
                    En el paso siguiente cargás los datos de cada visitante y pagás.
                  </p>
                  {/* TODO backend: la política de cancelación (`diasMinReembolso`) no viene en el detalle. */}
                </>
              )}
            </>
          )}
        </>
      )}
    </>
  );
}

/**
 * El establecimiento no puede cobrar, así que no se ofrecen fechas. No se dice
 * por qué: es un problema de la cuenta del productor, no del visitante.
 */
function SinReservas() {
  return (
    <div className="flex items-start gap-2.5 rounded-md border border-dashed border-sand bg-cream-tert p-4 text-[13px] text-fg-2">
      <CalendarOff size={18} className="mt-px shrink-0 text-fg-3" aria-hidden />
      <div>
        <div className="mb-0.5 font-semibold text-fg-1">No disponible para reservar</div>
        <div className="leading-[1.4]">
          Este establecimiento no está recibiendo reservas por el momento. Podés escribirles para consultar.
        </div>
      </div>
    </div>
  );
}

function Stepper({ tarifa, valor, puedeSumar, tactil, onChange }: {
  tarifa: TarifaActividad;
  valor: number;
  puedeSumar: boolean;
  tactil: boolean;
  onChange: (v: number) => void;
}) {
  const nombre = tarifa.nombre.toLowerCase();
  return (
    <div className="flex items-center justify-between gap-3 border-b border-cream-tert py-2.5">
      <div className="min-w-0 flex-1">
        <div className="text-[14.5px] font-semibold text-fg-1">{tarifa.nombre}</div>
        <div className="mt-px text-xs text-fg-3">{rangoEtario(tarifa)}</div>
        <div className={cn("mt-1 font-mono text-[13.5px] font-semibold", tarifa.precio > 0 ? "text-fg-1" : "text-green-800")}>
          {tarifa.precio > 0 ? moneyAr(tarifa.precio) : "Sin cargo"}
          {tarifa.precio > 0 && <span className="font-sans text-[11.5px] font-medium text-fg-3"> / persona</span>}
        </div>
      </div>
      <div className="flex items-center rounded-pill border border-outline-variant bg-surface p-0.5">
        <BotonStep tactil={tactil} onClick={() => onChange(Math.max(0, valor - 1))} disabled={valor <= 0} label={`Quitar ${nombre}`}>
          <Minus size={14} aria-hidden />
        </BotonStep>
        <span className="min-w-[26px] text-center font-mono text-sm font-semibold text-fg-1" aria-live="polite">{valor}</span>
        <BotonStep
          tactil={tactil}
          onClick={() => onChange(valor + 1)}
          disabled={!puedeSumar}
          label={`Agregar ${nombre}`}
          title={!puedeSumar ? "No quedan cupos disponibles para esta fecha" : undefined}
        >
          <Plus size={14} aria-hidden />
        </BotonStep>
      </div>
    </div>
  );
}

function BotonStep({ tactil, onClick, disabled, label, title, children }: {
  tactil: boolean;
  onClick: () => void;
  disabled: boolean;
  label: string;
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={title}
      className={cn("flex cursor-pointer items-center justify-center rounded-full text-fg-2 hover:bg-cream-tert disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent", tactil ? "size-10" : "size-[26px]")}
    >
      {children}
    </button>
  );
}
