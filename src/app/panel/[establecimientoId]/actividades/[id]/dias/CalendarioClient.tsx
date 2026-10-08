"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft, Ban, CalendarDays, CalendarPlus, ChevronLeft, DollarSign, FilePenLine, Grape, MapPin, Users,
} from "lucide-react";
import AsyncBoundary from "@/components/AsyncBoundary";
import { Alert, Button, Card, EstadoBadge, Skeleton, Toast } from "@/components/ui";
import { buttonClasses } from "@/components/ui/Button";
import type { ToastData } from "@/components/ui";
import { aISO, hoyISO, sumarDiasISO } from "@/components/ui/date-picker";
import { AbrirDiaModal } from "@/components/panel/gestion-dias/AbrirDiaModal";
import { CalendarioMensual, type Celda } from "@/components/panel/gestion-dias/CalendarioMensual";
import { EditarCupoModal } from "@/components/panel/gestion-dias/EditarCupoModal";
import { LoteDrawer } from "@/components/panel/gestion-dias/LoteDrawer";
import { VigenciasMes } from "@/components/panel/gestion-dias/piezas";
import { useEstablecimientos, useRutaPanel } from "@/hooks/useEstablecimientos";
import { useCalendarioGestion, useConfiguracionDias, useGestionDiasAcciones } from "@/hooks/useGestionDias";
import { moneyAr } from "@/lib/format";
import { ORDEN_DIAS, SUSPENDIDO_DIAS, diaSemanaDe, fechaCorta, mensajeErrorDias } from "@/lib/gestion-dias";
import type { EstadoActividad } from "@/types/actividad-prod";
import type { AltaDia, AltaLote, CalendarioGestion, DiaProgramado, DiaSemana, FechaISO } from "@/types/gestion-dias";

/** Si el backend no manda la ventana, es la misma que usa él. */
const VENTANA_POR_DEFECTO = 120;

const DE_BAJA = "La actividad está dada de baja: su calendario queda de consulta.";

const ESTADO_BADGE: Record<EstadoActividad, { tone: "success" | "neutral" | "danger"; label: string }> = {
  publicado: { tone: "success", label: "Publicada" },
  borrador: { tone: "neutral", label: "Borrador" },
  dado_de_baja: { tone: "danger", label: "Dada de baja" },
};

/** Códigos que significan que el calendario que ve el productor quedó viejo. */
const CALENDARIO_VIEJO = new Set(["A.diaFechaOcupada", "A.diaNoModificable", "A.diaYaComenzo", "A.cupoMenorAReservados"]);

type Mes = { anio: number; mes0: number };

/** "YYYY-MM" del mes de una fecha: compara bien como texto. */
const mesDe = (iso: FechaISO) => iso.slice(0, 7);
const claveMes = ({ anio, mes0 }: Mes) => `${anio}-${String(mes0 + 1).padStart(2, "0")}`;

function moverMes({ anio, mes0 }: Mes, delta: number): Mes {
  const d = new Date(anio, mes0 + delta, 1);
  return { anio: d.getFullYear(), mes0: d.getMonth() };
}

/** Un día activo o reprogramado que todavía no empezó: es el único al que se le cambia el cupo. */
function esModificable(d: DiaProgramado, ahora: string): boolean {
  return (d.estado === "activa" || d.estado === "reprogramada") && `${d.fecha}T${d.horaInicio}` > ahora;
}

/**
 * Las celdas del mes. Un día cancelado no ocupa la fecha —el backend deja abrir
 * otro ahí—, así que se lo trata como libre.
 */
function armarCeldas(
  { anio, mes0 }: Mes,
  dias: DiaProgramado[],
  { hoy, ahora, fechaMaxima, soloLectura }: { hoy: FechaISO; ahora: string; fechaMaxima: FechaISO; soloLectura: string | null },
): Celda[] {
  const porFecha = new Map<FechaISO, DiaProgramado>();
  for (const d of dias) {
    if (d.estado === "cancelada") continue;
    const previo = porFecha.get(d.fecha);
    // Si hay dos en la misma fecha, gana el que todavía se puede tocar.
    if (!previo || esModificable(d, ahora)) porFecha.set(d.fecha, d);
  }

  const celdas: Celda[] = [];
  const total = new Date(anio, mes0 + 1, 0).getDate();
  for (let n = 1; n <= total; n++) {
    const fecha = aISO(new Date(anio, mes0, n));
    const d = porFecha.get(fecha);
    if (d) {
      celdas.push(esModificable(d, ahora)
        ? { tipo: "programado", dia: n, ref: d, hoy: fecha === hoy, editable: !soloLectura }
        : { tipo: "finalizado", dia: n, pagadas: d.pagadas, cupoMax: d.cupoMax });
    } else if (fecha < hoy) {
      celdas.push({ tipo: "off", dia: n, titulo: "Día pasado" });
    } else if (fecha > fechaMaxima) {
      celdas.push({ tipo: "off", dia: n, titulo: "Fuera de la ventana de apertura" });
    } else if (soloLectura) {
      celdas.push({ tipo: "off", dia: n, titulo: soloLectura });
    } else {
      celdas.push({ tipo: "abrible", dia: n, fecha });
    }
  }
  return celdas;
}

/**
 * Horario con el que arranca un día nuevo: el que la actividad ya usa ese día
 * de la semana dentro de una vigencia que cubre la fecha; si no, cualquiera de
 * ese día de la semana; si no, el primero que haya.
 */
function horarioSugerido(cal: CalendarioGestion, fecha: FechaISO) {
  const dia = diaSemanaDe(fecha);
  const delDia = (desdeVigencias: CalendarioGestion["vigencias"]) =>
    desdeVigencias.flatMap((v) => v.horarios).find((h) => h.dias.includes(dia));
  const h =
    delDia(cal.vigencias.filter((v) => v.desde <= fecha && fecha <= v.hasta)) ??
    delDia(cal.vigencias) ??
    cal.vigencias[0]?.horarios[0];
  return h ? { horaInicio: h.horaInicio, horaFin: h.horaFin } : null;
}

/** Los días de la semana que la actividad ya usa en el mes, para arrancar el lote. */
function diasDelMes(cal: CalendarioGestion): DiaSemana[] {
  const usados = new Set(cal.vigencias.flatMap((v) => v.horarios.flatMap((h) => h.dias)));
  return ORDEN_DIAS.filter((d) => usados.has(d));
}

function Stat({ icon, label, value, mono }: { icon: React.ReactNode; label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex min-w-0 items-center gap-3 px-[22px] py-1">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-green-050 text-green-800">{icon}</div>
      <div className="min-w-0">
        <div className="text-[11px] font-semibold tracking-[.06em] text-fg-3 uppercase">{label}</div>
        <div className={`mt-0.5 text-lg leading-tight font-semibold text-fg-1 ${mono ? "font-mono" : ""}`}>{value}</div>
      </div>
    </div>
  );
}

function CalendarioSkeleton() {
  return (
    <div aria-busy>
      <Skeleton className="mb-3.5 h-4 w-56" />
      <div className="flex items-center gap-4">
        <Skeleton className="size-16 rounded-[14px]" />
        <div className="flex-1">
          <Skeleton className="h-8 w-80 max-w-full" />
          <Skeleton className="mt-2.5 h-4 w-64" />
        </div>
      </div>
      <Skeleton className="mt-[22px] h-[76px] rounded-lg" />
      <Card className="mt-[22px] p-6">
        <Skeleton className="h-6 w-64" />
        <Skeleton className="mt-5 h-[76px]" />
        <div className="mt-5 grid grid-cols-7 gap-1.5">
          {Array.from({ length: 35 }, (_, i) => <Skeleton key={i} className="min-h-24 rounded-[10px]" />)}
        </div>
      </Card>
    </div>
  );
}

export default function CalendarioClient({ actividadId }: { actividadId: string }) {
  const { activo } = useEstablecimientos();
  const ruta = useRutaPanel();
  const establecimientoId = activo?.id ?? "";
  const suspendido = !!activo?.establecimientoSuspendido;

  const [mes, setMes] = useState<Mes>(() => {
    const d = new Date();
    return { anio: d.getFullYear(), mes0: d.getMonth() };
  });
  const cal = useCalendarioGestion(establecimientoId, actividadId, mes.anio, mes.mes0 + 1);
  const conf = useConfiguracionDias(establecimientoId, actividadId);
  const acciones = useGestionDiasAcciones(establecimientoId, actividadId);

  // La cabecera no cambia entre meses: mientras se pide otro, se sigue mostrando
  // la última que llegó en vez de vaciar la pantalla.
  const base = cal.data ?? cal.ultimo;

  const [editando, setEditando] = useState<DiaProgramado | null>(null);
  const [abriendo, setAbriendo] = useState<FechaISO | null>(null);
  const [loteAbierto, setLoteAbierto] = useState(false);
  const [toast, setToast] = useState<ToastData | null>(null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 5200);
    return () => clearTimeout(t);
  }, [toast]);

  const hoy = hoyISO();
  // Si la configuración no llegó se usa la misma ventana que aplica el backend:
  // es sólo referencia, y el backend valida igual al guardar.
  const ventanaDias = conf.data?.ventanaDias ?? VENTANA_POR_DEFECTO;
  const fechaMaxima = conf.data?.fechaMaxima ?? sumarDiasISO(hoy, ventanaDias);
  const tarifas = conf.data?.tarifas ?? [];

  const soloLectura = suspendido ? SUSPENDIDO_DIAS : base?.estado === "dado_de_baja" ? DE_BAJA : null;

  const celdas = useMemo(() => {
    if (!cal.data) return [];
    const ahora = new Date();
    const hhmm = `${String(ahora.getHours()).padStart(2, "0")}:${String(ahora.getMinutes()).padStart(2, "0")}`;
    return armarCeldas(mes, cal.data.dias, { hoy, ahora: `${hoy}T${hhmm}`, fechaMaxima, soloLectura });
  }, [cal.data, mes, hoy, fechaMaxima, soloLectura]);

  // Hacia atrás, hasta donde empieza la vigencia o el mes actual, pero nunca
  // antes de enero de este año: el backend no consulta años anteriores. Hacia
  // adelante, hasta la última vigencia o el tope de la ventana, lo que esté más lejos.
  const piso = [base?.vigenciaDesde ?? hoy, hoy].map(mesDe).sort()[0];
  const minimo = piso < `${hoy.slice(0, 4)}-01` ? `${hoy.slice(0, 4)}-01` : piso;
  const maximo = [base?.vigenciaHasta ?? hoy, fechaMaxima].map(mesDe).sort()[1];
  const puedePrev = claveMes(mes) > minimo;
  const puedeNext = claveMes(mes) < maximo;
  const irA = (delta: number) => setMes((m) => moverMes(m, delta));

  function onElegir(c: Celda) {
    if (c.tipo === "programado" && c.editable) setEditando(c.ref);
    else if (c.tipo === "abrible") setAbriendo(c.fecha);
  }

  async function guardarCupo(dia: DiaProgramado, cupo: number): Promise<string | null> {
    const r = await acciones.cambiarCupo(dia.id, cupo);
    if (!r.ok) {
      if (r.code && CALENDARIO_VIEJO.has(r.code)) cal.reload();
      return mensajeErrorDias(r.code);
    }
    setEditando(null);
    cal.reload();
    setToast({ tone: "success", title: "Día actualizado", sub: `${fechaCorta(dia.fecha)} · ${cupo} cupos` });
    return null;
  }

  async function abrirDia(d: AltaDia): Promise<string | null> {
    const r = await acciones.abrirDia(d);
    if (!r.ok) {
      if (r.code && CALENDARIO_VIEJO.has(r.code)) cal.reload();
      return mensajeErrorDias(r.code);
    }
    setAbriendo(null);
    cal.reload();
    setToast({ tone: "success", title: "Día abierto para reservas", sub: `${fechaCorta(d.fecha)} · ${d.cupoMax} cupos` });
    return null;
  }

  async function abrirLote(l: AltaLote): Promise<string | null> {
    const r = await acciones.abrirLote(l);
    if (!r.ok) return mensajeErrorDias(r.code);
    setLoteAbierto(false);
    cal.reload();
    const creados = r.plan?.aCrear.length;
    const descartados = r.plan?.descartadas.length ?? 0;
    const partes = [creados === undefined ? "Se abrieron los días nuevos" : `Se ${creados === 1 ? "abrió 1 día nuevo" : `abrieron ${creados} días nuevos`}`];
    if (descartados > 0) partes.push(`${descartados} ${descartados === 1 ? "fecha se descartó" : "fechas se descartaron"}`);
    if (!base?.vigenciaHasta || l.hasta > base.vigenciaHasta) partes.push(`la vigencia llega hasta el ${fechaCorta(l.hasta)}`);
    setToast({ tone: descartados > 0 ? "info" : "success", title: "Días creados en lote", sub: partes.join(". ") + "." });
    return null;
  }

  const badge = base ? ESTADO_BADGE[base.estado] : null;

  return (
    <div className="min-h-screen bg-cream-bg">
      <div className="mx-auto max-w-[1240px] px-7 pt-6 pb-16">
        {!establecimientoId && (
          <Alert className="mb-5">
            No hay un establecimiento seleccionado. Elegí uno en el menú lateral para ver el calendario.
          </Alert>
        )}

        <AsyncBoundary
          loading={!!establecimientoId && !base && cal.isLoading}
          error={cal.error}
          onRetry={cal.reload}
          loadingLabel="Cargando calendario…"
          skeleton={<CalendarioSkeleton />}
          pad={72}
        >
          {base && badge && (
            <>
              <nav className="mb-3.5 flex items-center gap-2 text-[13px] text-fg-2" aria-label="Migas de pan">
                <Link href={ruta("actividades")} className="inline-flex items-center gap-1 font-medium text-fg-2 no-underline hover:text-fg-1">
                  <ChevronLeft className="size-3.5" /> Actividades
                </Link>
                <span className="text-fg-3">/</span>
                <span className="font-semibold text-fg-1">{base.nombre}</span>
              </nav>

              <div className="flex flex-wrap items-start justify-between gap-6">
                <div className="flex min-w-0 flex-1 items-center gap-4">
                  <div className="flex size-16 shrink-0 items-center justify-center rounded-[14px] border border-green-300 bg-green-050">
                    <Grape className="size-7 text-green-800" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h1 className="font-display text-[30px] leading-tight font-bold text-fg-1">{base.nombre}</h1>
                      <EstadoBadge tone={badge.tone}>{badge.label}</EstadoBadge>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-4">
                      {base.establecimiento && (
                        <span className="inline-flex items-center gap-[5px] text-[13px] text-fg-2">
                          <MapPin className="size-3.5 text-fg-3" /> {base.establecimiento}
                        </span>
                      )}
                      <span
                        className="inline-flex items-center gap-[5px] text-[13px] text-fg-2"
                        title="Desde la primera hasta la última vigencia cargada"
                      >
                        <CalendarDays className="size-3.5 text-fg-3" />
                        {base.vigenciaDesde && base.vigenciaHasta
                          ? `Vigencia general ${fechaCorta(base.vigenciaDesde)} → ${fechaCorta(base.vigenciaHasta)}`
                          : "Sin vigencia cargada"}
                      </span>
                    </div>
                  </div>
                </div>
                <Link href={ruta("actividades")} className={buttonClasses({ variant: "neutral" })}>
                  <ArrowLeft className="size-4" /> Volver
                </Link>
              </div>

              <div className="mt-[22px] flex flex-wrap items-center overflow-hidden rounded-lg border border-outline-variant bg-surface px-1.5 py-4">
                {base.precioBase !== null && (
                  <>
                    <Stat icon={<DollarSign className="size-4" />} label="Precio base" value={moneyAr(base.precioBase)} mono />
                    <div aria-hidden className="my-1.5 w-px self-stretch bg-outline-variant" />
                  </>
                )}
                <Stat icon={<Users className="size-4" />} label="Cupo base por día" value={String(base.cupoBase)} />
              </div>

              {suspendido && (
                <Alert tone="danger" icon={<Ban className="size-[18px]" />} className="mt-5">
                  <strong className="font-bold">Este establecimiento está suspendido.</strong> Podés consultar el
                  calendario, pero no abrir días ni cambiar cupos hasta que un administrador lo reactive.
                </Alert>
              )}
              {!suspendido && base.estado === "dado_de_baja" && (
                <Alert tone="danger" icon={<Ban className="size-[18px]" />} className="mt-5">{DE_BAJA}</Alert>
              )}
              {base.estado === "borrador" && (
                <Alert tone="warning" icon={<FilePenLine className="size-[18px]" />} className="mt-5">
                  <strong className="font-bold">Actividad en borrador.</strong> Los días que abras no se verán en el
                  catálogo hasta que la publiques desde el listado de actividades.
                </Alert>
              )}

              <Card className="mt-[22px] p-6">
                <div className="mb-[18px] flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-[9px]">
                    <CalendarDays className="size-[19px] text-green-800" />
                    <h2 className="font-display text-xl font-bold text-fg-1">Calendario de disponibilidad</h2>
                  </div>
                  <Button
                    variant="neutral"
                    size="sm"
                    onClick={() => setLoteAbierto(true)}
                    disabled={!!soloLectura}
                    title={soloLectura ?? undefined}
                    className="shrink-0 whitespace-nowrap"
                  >
                    <CalendarPlus className="size-[15px]" /> Agregar días
                  </Button>
                </div>
                <p className="mb-5 text-sm leading-normal text-fg-2">
                  {soloLectura ? (
                    "Los días se muestran de consulta: no se pueden abrir ni modificar."
                  ) : (
                    <>
                      Tocá un <strong className="text-fg-1">día programado</strong> para modificar su cupo, o un{" "}
                      <strong className="text-fg-1">día libre</strong> para abrirlo a reservas.
                    </>
                  )}
                </p>

                {cal.data ? (
                  <VigenciasMes vigencias={cal.data.vigencias} mes0={mes.mes0} />
                ) : (
                  <Skeleton className="mb-5 h-[76px]" />
                )}

                <CalendarioMensual
                  anio={mes.anio}
                  mes0={mes.mes0}
                  celdas={celdas}
                  cargando={!cal.data}
                  onElegir={onElegir}
                  onPrev={() => irA(-1)}
                  onNext={() => irA(1)}
                  puedePrev={puedePrev}
                  puedeNext={puedeNext}
                />
              </Card>
            </>
          )}
        </AsyncBoundary>
      </div>

      {editando && base && (
        <EditarCupoModal
          dia={editando}
          actividad={base.nombre}
          cupoBase={base.cupoBase}
          tarifas={tarifas}
          guardando={acciones.guardando}
          onGuardar={(cupo) => guardarCupo(editando, cupo)}
          onCerrar={() => setEditando(null)}
        />
      )}

      {abriendo && base && (
        <AbrirDiaModal
          fecha={abriendo}
          cupoBase={base.cupoBase}
          horario={horarioSugerido(base, abriendo)}
          tarifas={tarifas}
          guardando={acciones.guardando}
          onAbrir={abrirDia}
          onCerrar={() => setAbriendo(null)}
        />
      )}

      {loteAbierto && base && (
        <LoteDrawer
          establecimientoId={establecimientoId}
          actividadId={actividadId}
          actividad={base.nombre}
          cupoBase={base.cupoBase}
          diasSugeridos={diasDelMes(base)}
          horario={base.vigencias.at(-1)?.horarios[0] ?? null}
          fechaMaxima={fechaMaxima}
          ventanaDias={ventanaDias}
          tarifas={tarifas}
          guardando={acciones.guardando}
          onCrear={abrirLote}
          onCerrar={() => setLoteAbierto(false)}
        />
      )}

      {toast && <Toast {...toast} />}
    </div>
  );
}
