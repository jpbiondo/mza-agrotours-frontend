"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
   ArrowRight, Ban, CalendarCheck, CalendarDays, CheckCircle2, Clock, CreditCard, Hourglass, Info,
  ListChecks, MapPin, X,
} from "lucide-react";
import AsyncBoundary from "@/components/AsyncBoundary";
import { Alert, BackLink, Card, EstadoBadge, IconButton, Skeleton } from "@/components/ui";
import { buttonClasses } from "@/components/ui/Button";
import { hoyISO, sumarDiasISO, aISO } from "@/components/ui/date-picker";
import { CropChip, EstadoActividadBadge, IconoActividad } from "@/components/panel/actividad/identidad";
import { BarraCupos, CalendarioMensual, type Celda, type ItemLeyenda } from "@/components/panel/gestion-dias/CalendarioMensual";
import { useEstablecimientos, useRutaPanel } from "@/hooks/useEstablecimientos";
import { useCalendarioActividad } from "@/hooks/useCalendarioActividad";
import { claveMes, fechaLarga, moverMes, type Mes } from "@/lib/gestion-dias";
import { cn } from "@/lib/utils";
import type { DiaHorario } from "@/types/actividad-prod";
import type { DiaProgramado, FechaISO } from "@/types/gestion-dias";

/**
 * Hasta dónde se puede navegar hacia adelante: la misma ventana de apertura que
 * usa el backend, que no deja programar días más allá.
 */
const VENTANA_DIAS = 120;

const LEYENDA: ItemLeyenda[] = [
  { muestra: "border border-green-300 bg-green-050", label: "Programado" },
  { muestra: "bg-green-800", label: "Seleccionado" },
  { muestra: "bg-green-700", label: "Cupos pagados" },
  { muestra: "bg-warning", label: "En espera de pago" },
  { muestra: "border border-dashed border-outline-variant", label: "No se dicta" },
];

/** Un día ya dictado: sus pagadas pasan a contarse como finalizadas y no quedan cupos en espera. */
const esPasado = (d: DiaProgramado, hoy: FechaISO) => d.estado === "finalizada" || d.fecha < hoy;

/**
 * Las celdas del mes. Un día cancelado no se dicta; si en la misma fecha hay
 * otro que no lo está (se reabrió), se muestra ese.
 */
function armarCeldas({ anio, mes0 }: Mes, dias: DiaProgramado[], hoy: FechaISO, seleccionado: string | null): Celda[] {
  const porFecha = new Map<FechaISO, DiaProgramado>();
  for (const d of dias) if (d.estado !== "cancelada") porFecha.set(d.fecha, d);
  const cancelados = new Set(dias.filter((d) => d.estado === "cancelada").map((d) => d.fecha));

  const celdas: Celda[] = [];
  const total = new Date(anio, mes0 + 1, 0).getDate();
  for (let n = 1; n <= total; n++) {
    const fecha = aISO(new Date(anio, mes0, n));
    const d = porFecha.get(fecha);
    if (d) {
      celdas.push({
        tipo: "programado", dia: n, ref: d, hoy: fecha === hoy, clickeable: true,
        seleccionado: d.id === seleccionado, titulo: "Ver el detalle de este día",
      });
    } else {
      celdas.push({ tipo: "off", dia: n, titulo: cancelados.has(fecha) ? "Día cancelado" : "No se dicta" });
    }
  }
  return celdas;
}

/* ---- Piezas ------------------------------------------------------------- */

const TONOS_METRICA = {
  neutral: "border-outline-variant bg-cream-tert text-fg-2",
  green: "border-green-100 bg-green-050 text-green-700",
  warning: "border-warning/30 bg-warning-fill text-warning",
};

function Metrica({
  icon, label, value, sub, tono,
}: { icon: React.ReactNode; label: string; value: number; sub: string; tono: keyof typeof TONOS_METRICA }) {
  return (
    <div className="flex min-w-40 flex-[1_1_180px] items-center gap-4 rounded-lg border border-outline-variant bg-surface p-5">
      <div className={cn("flex size-[46px] shrink-0 items-center justify-center rounded-[12px] border", TONOS_METRICA[tono])}>
        {icon}
      </div>
      <div className="min-w-0">
        <div className="font-mono text-[26px] leading-none font-semibold text-fg-1">{value}</div>
        <div className="t-label mt-1.5">{label}</div>
        <div className="mt-[3px] text-xs text-fg-3">{sub}</div>
      </div>
    </div>
  );
}

function DiasHorarios({ dias }: { dias: DiaHorario[] }) {
  return (
    <Card className="p-5">
      <div className="t-label mb-3 flex items-center gap-[7px]">
        <Clock className="size-3.5 text-fg-2" /> Días y horas disponibles
      </div>
      {dias.length === 0 ? (
        <p className="text-[13px] text-fg-3">Sin días cargados.</p>
      ) : (
        <ul className="flex flex-col">
          {dias.map((d, i) => (
            <li
              key={i}
              className={cn(
                "flex items-center justify-between gap-3 py-[11px] text-[14.5px] text-fg-1",
                i < dias.length - 1 && "border-b border-cream-tert",
              )}
            >
              <span className="inline-flex items-center gap-[9px] font-semibold">
                <span className="size-[7px] shrink-0 rounded-full bg-green-700" />
                {d.dia}
              </span>
              {d.desde && <span className="font-mono text-[13.5px] text-fg-2">{d.desde} – {d.hasta}</span>}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function LeyendaCupo({ color, label, n }: { color: string; label: string; n: number }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[12.5px] text-fg-2">
      <span className={cn("size-[9px] shrink-0 rounded-[3px]", color)} />
      <span className="font-mono font-bold text-fg-1">{n}</span>
      {label}
    </span>
  );
}

function SinSeleccion() {
  return (
    <Card className="border-dashed border-sand p-[22px] text-center motion-safe:animate-[popIn_.2s_cubic-bezier(.2,0,0,1)]">
      <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full border border-green-100 bg-green-050">
        <CalendarDays className="size-6 text-green-700" />
      </div>
      <div className="text-[15px] font-semibold text-fg-1">Seleccioná una fecha</div>
      <p className="mx-auto mt-1.5 max-w-[280px] text-[13.5px] leading-normal text-fg-2">
        Tocá un día programado del calendario para ver sus cupos y las reservas en espera de pago.
      </p>
    </Card>
  );
}

/** Resumen del día elegido. En pantallas chicas se muestra dentro de una hoja inferior. */
function ResumenDia({
  dia, hoy, href, onCerrar, enHoja,
}: { dia: DiaProgramado; hoy: FechaISO; href: string; onCerrar: () => void; enHoja?: boolean }) {
  const { pagadas, pendientes, cupoMax } = dia;
  const pasado = esPasado(dia, hoy);
  const ocupados = pagadas + pendientes;
  const libres = Math.max(0, cupoMax - ocupados);
  const lleno = ocupados >= cupoMax;

  const cuerpo = (
    <>
      <div className="flex items-center justify-between gap-3 border-b border-green-100 bg-green-050 px-[22px] py-[18px]">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-[42px] shrink-0 items-center justify-center rounded-[10px] bg-green-800 shadow-[inset_0_-2px_0_var(--green-900)]">
            <CalendarCheck className="size-[21px] text-white" />
          </div>
          <div className="min-w-0">
            <div className="text-[15.5px] leading-tight font-bold text-fg-1">{fechaLarga(dia.fecha)}</div>
            {dia.horaInicio && (
              <div className="mt-[3px] font-mono text-[12.5px] text-fg-2">{dia.horaInicio} – {dia.horaFin} h</div>
            )}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <EstadoBadge tone={pasado ? "neutral" : "info"}>{pasado ? "Finalizado" : "Próximo"}</EstadoBadge>
          <IconButton onClick={onCerrar} aria-label="Cerrar detalle">
            <X />
          </IconButton>
        </div>
      </div>

      <div className="flex flex-col gap-[18px] p-[22px]">
        {/* Las pagadas son lo que le importa al productor: si cancela o reprograma, son las que reembolsa. */}
        <div className="flex items-center gap-[13px]">
          <div
            className={cn(
              "flex size-11 shrink-0 items-center justify-center rounded-[12px] border",
              pagadas > 0 ? "border-green-100 bg-green-050 text-green-700" : "border-outline-variant bg-cream-tert text-fg-3",
            )}
          >
            {pasado ? <CheckCircle2 className="size-[22px]" /> : <CreditCard className="size-[22px]" />}
          </div>
          <div>
            <div className="flex items-baseline gap-[7px]">
              <span className="font-mono text-2xl leading-none font-bold text-fg-1">{pagadas}</span>
              <span className="text-sm text-fg-2">
                {pasado
                  ? pagadas === 1 ? "cupo finalizado" : "cupos finalizados"
                  : pagadas === 1 ? "cupo pagado" : "cupos pagados"}
              </span>
            </div>
            <div className="mt-1 text-[12.5px] leading-snug text-fg-3">
              {pasado
                ? "Jornada realizada"
                : pagadas > 0
                  ? "Confirmados: si cancelás o reprogramás el día, se gestionan sus reembolsos"
                  : "Todavía sin reservas pagadas para este día"}
            </div>
          </div>
        </div>

        {!pasado && (
          <div
            className={cn(
              "flex items-center gap-[13px] rounded-[12px] border px-3.5 py-3",
              pendientes > 0 ? "border-warning/30 bg-warning-fill" : "border-outline-variant bg-cream-tert",
            )}
          >
            <div
              className={cn(
                "flex size-[38px] shrink-0 items-center justify-center rounded-[10px] border bg-surface",
                pendientes > 0 ? "border-warning/30 text-warning" : "border-outline-variant text-fg-3",
              )}
            >
              <Hourglass className="size-[19px]" />
            </div>
            <div>
              <div className="flex items-baseline gap-[7px]">
                <span className="font-mono text-lg leading-none font-bold text-fg-1">{pendientes}</span>
                <span className="text-[13.5px] text-fg-2">
                  {pendientes === 1 ? "cupo en espera de pago" : "cupos en espera de pago"}
                </span>
              </div>
              <div className="mt-[3px] text-xs leading-snug text-fg-3">
                Retienen el cupo hasta que se confirme el pago. Si no se paga, se libera.
              </div>
            </div>
          </div>
        )}

        <div className="rounded-[12px] bg-cream-tert px-4 py-3.5">
          <div className="mb-2.5 flex items-center justify-between">
            <span className="t-label">Reparto de cupos</span>
            <span className={cn("inline-flex items-baseline gap-0.5 font-mono text-lg font-bold", lleno ? "text-warning" : "text-green-800")}>
              {ocupados}
              <span className="text-sm font-semibold text-fg-3">/{cupoMax}</span>
            </span>
          </div>
          {/* El fondo arena hace de cupos libres. */}
          <BarraCupos pagadas={pagadas} pendientes={pendientes} cupoMax={cupoMax} className="h-[9px] bg-sand" />
          <div className="mt-[11px] flex flex-wrap gap-x-3.5 gap-y-1.5">
            <LeyendaCupo color="bg-green-700" label={pasado ? "finalizados" : "pagados"} n={pagadas} />
            {!pasado && <LeyendaCupo color="bg-warning" label="en espera" n={pendientes} />}
            <LeyendaCupo color="bg-sand" label="libres" n={libres} />
          </div>
          {lleno && (
            <div className="mt-[11px] flex items-center gap-1.5 text-[12.5px] text-warning">
              <CheckCircle2 className="size-3.5" /> Cupos completos para este día
            </div>
          )}
        </div>

        <Link href={href} className={buttonClasses({ className: "w-full" })}>
          <ListChecks className="size-4" /> Ver detalle de reservas <ArrowRight className="size-4" />
        </Link>
      </div>
    </>
  );

  if (enHoja) return cuerpo;
  return (
    <Card className="overflow-hidden p-0 motion-safe:animate-[popIn_.2s_cubic-bezier(.2,0,0,1)]">
      {cuerpo}
    </Card>
  );
}

function CalendarioSkeleton() {
  return (
    <div aria-busy>
      <Skeleton className="mb-[18px] h-4 w-40" />
      <div className="flex items-start gap-[18px]">
        <Skeleton className="size-[60px] rounded-[16px]" />
        <div className="flex-1">
          <Skeleton className="h-4 w-56" />
          <Skeleton className="mt-2 h-8 w-96 max-w-full" />
          <Skeleton className="mt-4 h-6 w-64" />
        </div>
      </div>
      <div className="my-[26px] flex flex-wrap gap-4">
        {Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-[88px] min-w-40 flex-[1_1_180px] rounded-lg" />)}
      </div>
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <Card className="p-6">
          <Skeleton className="h-6 w-64" />
          <div className="mt-5 grid grid-cols-7 gap-1.5">
            {Array.from({ length: 35 }, (_, i) => <Skeleton key={i} className="min-h-24 rounded-[10px]" />)}
          </div>
        </Card>
        <div className="flex flex-col gap-4">
          <Skeleton className="h-52 rounded-lg" />
          <Skeleton className="h-40 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

/* ---- Pantalla ----------------------------------------------------------- */

/** "YYYY-MM" → mes; cualquier otra cosa cae en el mes actual. */
function mesDesde(clave: string | undefined): Mes {
  const m = clave && /^(\d{4})-(\d{2})$/.exec(clave);
  if (m && Number(m[2]) >= 1 && Number(m[2]) <= 12) return { anio: Number(m[1]), mes0: Number(m[2]) - 1 };
  const d = new Date();
  return { anio: d.getFullYear(), mes0: d.getMonth() };
}

export default function CalendarioActividadClient({ actividadId, mesInicial }: { actividadId: string; mesInicial?: string }) {
  const { activo } = useEstablecimientos();
  const ruta = useRutaPanel();
  const establecimientoId = activo?.id ?? "";

  // Al volver desde las reservas de un día se vuelve a abrir el mes de ese día.
  const [mes, setMes] = useState<Mes>(() => mesDesde(mesInicial));
  const cal = useCalendarioActividad(establecimientoId, actividadId, mes.anio, mes.mes0 + 1);
  // La cabecera y las métricas no dependen del mes: mientras se pide otro, se
  // sigue mostrando lo último que llegó en vez de vaciar la pantalla.
  const base = cal.data ?? cal.ultimo;

  const [seleccionado, setSeleccionado] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSeleccionado(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const hoy = hoyISO();
  const celdas = useMemo(
    () => (cal.data ? armarCeldas(mes, cal.data.diasDelMes, hoy, seleccionado) : []),
    [cal.data, mes, hoy, seleccionado],
  );
  const dia = cal.data?.diasDelMes.find((d) => d.id === seleccionado) ?? null;

  // El backend no consulta años anteriores al actual ni días más allá de la ventana de apertura.
  const minimo = `${hoy.slice(0, 4)}-01`;
  const maximo = sumarDiasISO(hoy, VENTANA_DIAS).slice(0, 7);
  const irA = (delta: number) => {
    setMes((m) => moverMes(m, delta));
    setSeleccionado(null);
  };
  const cerrar = () => setSeleccionado(null);
  const hrefReservas = (d: DiaProgramado) => ruta("actividades", actividadId, "calendario", d.id);

  return (
    <div className="min-h-screen bg-cream-bg">
      <div className="mx-auto max-w-[1240px] px-7 pt-6 pb-20">
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
          {base && (
            <>
              <BackLink href={ruta("actividades")} className="mb-[18px]">
                Volver a actividades
              </BackLink>

              <div className="mb-2 flex flex-wrap items-start gap-[18px]">
                <div
                  className={cn(
                    "flex size-[60px] shrink-0 items-center justify-center rounded-[16px] border",
                    base.estado === "dado_de_baja"
                      ? "border-outline-variant bg-cream-tert text-fg-3"
                      : "border-green-100 bg-green-050 text-green-700",
                  )}
                >
                  <IconoActividad cultivos={base.cultivos} className="size-[30px]" />
                </div>
                <div className="min-w-[260px] flex-[1_1_320px]">
                  {base.establecimiento && (
                    <div className="mb-1.5 flex items-center gap-2 text-[13px] text-fg-3">
                      <MapPin className="size-3.5 text-brown-700" />
                      <span>{[base.establecimiento, base.departamento].filter(Boolean).join(" · ")}</span>
                    </div>
                  )}
                  <div className="flex flex-wrap items-center gap-3">
                    <h1 className="font-display text-[30px] leading-tight font-bold text-fg-1">{base.nombre}</h1>
                    <EstadoActividadBadge estado={base.estado} />
                  </div>
                  <div className="mt-3.5">
                    <div className="t-label mb-[7px]">Cultivos asociados</div>
                    <div className="flex flex-wrap gap-[7px]">
                      {base.cultivos.length === 0 ? (
                        <span className="text-[13px] text-fg-3">Sin cultivos asociados.</span>
                      ) : (
                        base.cultivos.map((c) => <CropChip key={c.id}>{c.nombre}</CropChip>)
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {base.estado === "dado_de_baja" && (
                <Alert icon={<Ban className="size-[18px]" />} className="mt-5">
                  <strong className="font-bold">Actividad dada de baja.</strong> Podés consultar su calendario y sus
                  reservas, pero ya no se pueden abrir ni modificar días.
                </Alert>
              )}

              <div className="my-[26px] flex flex-wrap gap-4">
                <Metrica
                  icon={<CreditCard className="size-[22px]" />}
                  label="Cupos pagados"
                  value={base.metricas.pagadas}
                  sub="Personas confirmadas en días próximos"
                  tono="green"
                />
                <Metrica
                  icon={<Hourglass className="size-[22px]" />}
                  label="En espera de pago"
                  value={base.metricas.pendientes}
                  sub="Cupos retenidos hasta el pago"
                  tono="warning"
                />
                <Metrica
                  icon={<CheckCircle2 className="size-[22px]" />}
                  label="Finalizados"
                  value={base.metricas.finalizadas}
                  sub="Personas en jornadas ya realizadas"
                  tono="neutral"
                />
              </div>

              <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
                <Card className="min-w-0 p-6">
                  <div className="mb-[18px] flex items-center gap-[9px]">
                    <CalendarDays className="size-[19px] text-green-800" />
                    <h2 className="font-display text-xl font-bold text-fg-1">Calendario de disponibilidad</h2>
                  </div>
                  <CalendarioMensual
                    anio={mes.anio}
                    mes0={mes.mes0}
                    celdas={celdas}
                    cargando={!cal.data}
                    onElegir={(c) => c.tipo === "programado" && setSeleccionado(c.ref.id)}
                    onPrev={() => irA(-1)}
                    onNext={() => irA(1)}
                    puedePrev={claveMes(mes) > minimo}
                    puedeNext={claveMes(mes) < maximo}
                    leyenda={LEYENDA}
                  />
                  <p className="mt-5 flex items-start gap-[9px] text-[13.5px] leading-normal text-fg-2">
                    <Info className="mt-0.5 size-4 shrink-0 text-fg-3" />
                    <span>
                      Sólo los días resaltados están abiertos al público. Seleccioná uno para ver el reparto de cupos y
                      los que están en espera de pago.
                    </span>
                  </p>
                </Card>

                <div className="flex min-w-0 flex-col gap-4">
                  <div className="hidden xl:block">
                    {dia ? <ResumenDia key={dia.id} dia={dia} hoy={hoy} href={hrefReservas(dia)} onCerrar={cerrar} /> : <SinSeleccion />}
                  </div>
                  <DiasHorarios dias={base.dias} />
                  <Card className="border-outline-variant bg-cream-tert p-[18px]">
                    <div className="flex items-start gap-[11px]">
                      <Info className="mt-px size-[18px] shrink-0 text-brown-700" />
                      <p className="text-[13px] leading-normal text-fg-2">
                        El número de cada día son los cupos pagados sobre el cupo máximo de ese día.
                      </p>
                    </div>
                  </Card>
                </div>
              </div>
            </>
          )}
        </AsyncBoundary>
      </div>

      {/* Debajo de `xl` no entra la columna lateral: el detalle sube como hoja inferior. */}
      {dia && (
        <div className="xl:hidden">
          <div
            aria-hidden
            onClick={cerrar}
            className="fixed inset-0 z-[120] bg-[rgba(31,28,22,.32)] motion-safe:animate-[fadeIn_.18s_ease-out]"
          />
          <div
            role="dialog"
            aria-label="Detalle del día"
            className="fixed inset-x-0 bottom-0 z-[121] max-h-[88vh] overflow-y-auto rounded-t-[16px] border-t border-outline-variant bg-surface shadow-pop motion-safe:animate-[sheetIn_.22s_cubic-bezier(.2,0,0,1)]"
          >
            <div className="absolute inset-x-0 top-2 mx-auto h-1 w-10 rounded-pill bg-sand" />
            <ResumenDia dia={dia} hoy={hoy} href={hrefReservas(dia)} onCerrar={cerrar} enHoja />
          </div>
        </div>
      )}
    </div>
  );
}
