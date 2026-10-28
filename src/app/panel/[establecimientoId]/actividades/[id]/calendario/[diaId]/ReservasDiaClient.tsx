"use client";
import { useState } from "react";
import Link from "next/link";
import {
   Banknote, CalendarClock, CalendarDays, CalendarX, CheckCircle2, Clock, CreditCard, FilterX, MapPin,
  Printer, RotateCcw, Settings2, SlidersHorizontal, Timer, Users, XCircle,
} from "lucide-react";
import AsyncBoundary from "@/components/AsyncBoundary";
import { Pagination } from "@/components/catalog/controls";
import { Alert, BackLink, Button, Card, EstadoBadge, Skeleton } from "@/components/ui";
import { notify } from "@/lib/notify";
import { buttonClasses } from "@/components/ui/Button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { hoyISO } from "@/components/ui/date-picker";
import { CropChip, IconoActividad } from "@/components/panel/actividad/identidad";
import { CancelarDiaModal } from "@/components/panel/gestion-dias/CancelarDiaModal";
import { PlanillaDiaDialog } from "@/components/panel/gestion-dias/PlanillaDiaDialog";
import { useEstablecimientos, useRutaPanel } from "@/hooks/useEstablecimientos";
import {
  ESTADOS_PLANILLA, useCancelarDia, useEstadosReservaDia, usePlanillaDia, useReservasDia, useResumenDia,
} from "@/hooks/useReservasDia";
import type { FormatoExport } from "@/lib/exportar";
import { fmtCodigoReserva, moneyAr } from "@/lib/format";
import { fechaCorta, fechaLarga, mensajeErrorDias } from "@/lib/gestion-dias";
import { cn } from "@/lib/utils";
import type { ConteoEstados, EstadoReservaDia, ReservaDia, ResumenDia } from "@/types/reservas-dia";

const PAGE_SIZE = 10;

type Tono = "neutral" | "success" | "warning" | "danger" | "info";

const ESTADO_META: Record<EstadoReservaDia, { label: string; tono: Tono; icon: React.ReactNode; pie: string }> = {
  pendiente: { label: "Pendiente", tono: "warning", icon: <Clock className="size-[15px] text-warning" />, pie: "A la espera del pago" },
  pagada: { label: "Pagada", tono: "info", icon: <CreditCard className="size-[15px] text-info" />, pie: "Pago confirmado" },
  cancelada_con_reembolso: {
    label: "Cancelada con reembolso", tono: "neutral", icon: <RotateCcw className="size-[15px] text-fg-3" />,
    pie: "Reembolso emitido al visitante",
  },
  cancelada_sin_reembolso: {
    label: "Cancelada sin reembolso", tono: "danger", icon: <XCircle className="size-[15px] text-danger" />,
    pie: "Cancelada fuera de plazo · sin reembolso",
  },
  finalizada: { label: "Finalizada", tono: "success", icon: <CheckCircle2 className="size-[15px] text-success" />, pie: "Experiencia completada" },
  expirada: { label: "Expirada", tono: "neutral", icon: <Timer className="size-[15px] text-fg-3" />, pie: "No se pagó a tiempo" },
};

type Temporalidad = "hoy" | "futura" | "pasada";

const TEMPORALIDAD: Record<Temporalidad, { label: string; tono: Tono }> = {
  hoy: { label: "Hoy", tono: "info" },
  futura: { label: "Próxima", tono: "neutral" },
  pasada: { label: "Pasada", tono: "neutral" },
};

/**
 * Los estados que tienen sentido según la fecha: un día que todavía no pasó no
 * tiene reservas finalizadas, y uno que ya pasó no tiene pendientes ni pagadas.
 */
const ESTADOS_POR_TEMPORALIDAD: Record<Temporalidad, EstadoReservaDia[]> = {
  hoy: ["pendiente", "pagada", "cancelada_con_reembolso", "cancelada_sin_reembolso"],
  futura: ["pendiente", "pagada", "cancelada_con_reembolso", "cancelada_sin_reembolso"],
  pasada: ["cancelada_con_reembolso", "cancelada_sin_reembolso", "finalizada"],
};

const TODOS = "todos";

function temporalidadDe(fecha: string, hoy: string): Temporalidad {
  if (fecha === hoy) return "hoy";
  return fecha < hoy ? "pasada" : "futura";
}

/**
 * Las opciones del filtro: las que corresponden a la fecha y, por si el backend
 * todavía no cerró el día, cualquier otro estado en el que efectivamente haya reservas.
 */
function opcionesFiltro(temporalidad: Temporalidad, conteo: ConteoEstados): EstadoReservaDia[] {
  const base = ESTADOS_POR_TEMPORALIDAD[temporalidad];
  const extra = (Object.keys(conteo) as EstadoReservaDia[]).filter((e) => !base.includes(e) && (conteo[e] ?? 0) > 0);
  return [...base, ...extra];
}

/* ---- Piezas ------------------------------------------------------------- */

function FiltroEstado({
  value, onChange, opciones, conteo, total,
}: {
  value: EstadoReservaDia | null;
  onChange: (v: EstadoReservaDia | null) => void;
  opciones: EstadoReservaDia[];
  conteo: ConteoEstados | null;
  total: number;
}) {
  const items = [
    { value: TODOS, label: "Todos" },
    ...opciones.map((e) => ({ value: e, label: ESTADO_META[e].label })),
  ];
  const cuenta = (v: string) => (v === TODOS ? total : conteo ? (conteo[v as EstadoReservaDia] ?? 0) : null);

  return (
    <Select
      items={items}
      value={value ?? TODOS}
      onValueChange={(v) => onChange(!v || v === TODOS ? null : (v as EstadoReservaDia))}
    >
      <SelectTrigger
        aria-label="Filtrar por estado"
        className="h-auto! w-full min-w-[280px] rounded-md border-sand bg-surface py-3 pr-3.5 pl-3.5 text-[14.5px] font-medium text-fg-1 shadow-[inset_0_-2px_0_var(--outline-variant)] sm:w-auto"
      >
        <span className="flex min-w-0 items-center gap-[9px]">
          <SlidersHorizontal className="size-4 text-green-800" />
          <span className="text-[13px] text-fg-3">Estado:</span>
          <SelectValue className="font-semibold" />
        </span>
      </SelectTrigger>
      <SelectContent className="rounded-md bg-surface p-1.5 shadow-pop">
        {items.map((o) => {
          const n = cuenta(o.value);
          return (
            <SelectItem key={o.value} value={o.value} className="rounded-[8px] py-2.5 pr-3 pl-3 text-sm">
              <span className="flex flex-1 items-center justify-between gap-3">
                {o.label}
                {n !== null && (
                  <span className="min-w-[22px] rounded-pill bg-cream-tert px-2 py-0.5 text-center font-mono text-xs font-semibold text-fg-3">
                    {n}
                  </span>
                )}
              </span>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}

function iniciales(nombre: string): string {
  return nombre.split(/\s+/).filter(Boolean).map((s) => s[0]).join("").slice(0, 2).toUpperCase();
}

function TarjetaReserva({ r }: { r: ReservaDia }) {
  const meta = ESTADO_META[r.estado];
  const cancelada = r.estado === "cancelada_con_reembolso" || r.estado === "cancelada_sin_reembolso";

  return (
    <Card className="overflow-hidden p-0">
      <div
        className={cn(
          "flex flex-wrap items-center justify-between gap-3.5 border-b border-outline-variant px-[22px] py-4",
          cancelada ? "bg-cream-tert" : "bg-surface",
        )}
      >
        <div className="flex min-w-0 items-center gap-3.5">
          <div className="flex size-[42px] shrink-0 items-center justify-center rounded-[10px] border border-green-100 bg-green-050">
            <Users className="size-5 text-green-700" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-baseline gap-[9px]">
              <span className="font-display text-[17px] font-bold text-fg-1">
                {r.personas} {r.personas === 1 ? "persona" : "personas"}
              </span>
              <span className="font-mono text-[11.5px] text-fg-3" title={r.id}>{fmtCodigoReserva(r.id)}</span>
            </div>
            {r.rangos.length > 0 && (
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {r.rangos.map((g) => (
                  <span
                    key={g.rango}
                    className="inline-flex items-center gap-[5px] rounded-pill border border-outline-variant bg-cream-tert px-2.5 py-[3px] text-xs font-semibold text-fg-2"
                  >
                    <span className="font-mono text-fg-1">{g.cantidad}</span>
                    {g.rango}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
        <EstadoBadge tone={meta.tono}>{meta.label}</EstadoBadge>
      </div>

      <div className="px-[22px] pt-2 pb-3.5">
        <div className="t-label mt-2.5 mb-1">Visitantes</div>
        <ul>
          {r.visitantes.map((v, i) => (
            <li
              key={i}
              className={cn(
                "flex items-center justify-between gap-3 py-[9px]",
                i < r.visitantes.length - 1 && "border-b border-cream-tert",
              )}
            >
              <span className="inline-flex min-w-0 items-center gap-2.5">
                <span className="flex size-[26px] shrink-0 items-center justify-center rounded-full bg-brown-100 text-[11px] font-bold text-brown-700">
                  {iniciales(v.nombre)}
                </span>
                <span className="truncate text-[14.5px] font-medium text-fg-1">{v.nombre}</span>
              </span>
              <span className="inline-flex shrink-0 items-center gap-2">
                {v.tipo && <span className="text-xs text-fg-3">{v.tipo}</span>}
                <span className="rounded-[6px] bg-cream-tert px-2 py-0.5 font-mono text-[13px] font-semibold text-fg-2">
                  {v.edad} {v.edad === 1 ? "año" : "años"}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-outline-variant bg-cream-tert px-[22px] py-3">
        <span className="inline-flex items-center gap-[7px] text-[12.5px] text-fg-2">
          {meta.icon} {meta.pie}
        </span>
        <span className="text-[12.5px] text-fg-3">
          {cancelada ? "Total reserva" : "Subtotal"}
          <span
            className={cn(
              "ml-1.5 font-mono text-[14.5px] font-semibold",
              cancelada ? "text-fg-3" : "text-green-800",
              r.estado === "cancelada_con_reembolso" && "line-through",
            )}
          >
            {moneyAr(r.total)}
          </span>
        </span>
      </div>
    </Card>
  );
}

function SinReservas({ filtrado, onLimpiar }: { filtrado: boolean; onLimpiar: () => void }) {
  return (
    <Card className="border-dashed border-sand px-8 py-[60px] text-center">
      <div className="mx-auto mb-5 flex size-[72px] items-center justify-center rounded-full bg-cream-tert">
        {filtrado ? <FilterX className="size-8 text-brown-700" /> : <CalendarX className="size-8 text-brown-700" />}
      </div>
      <h2 className="mb-2 font-display text-xl font-bold text-fg-1">
        {filtrado ? "Sin reservas con ese estado" : "Todavía no hay reservas para este día"}
      </h2>
      <p className="mx-auto mb-[22px] max-w-[440px] text-[15px] leading-normal text-fg-2">
        {filtrado
          ? "Probá con otro estado o quitá el filtro para ver todas las reservas del día."
          : "Cuando los visitantes reserven esta experiencia, vas a verlas acá con sus datos y estado de pago."}
      </p>
      {filtrado && (
        <Button variant="neutral" onClick={onLimpiar}>
          <RotateCcw className="size-4" /> Ver todas
        </Button>
      )}
    </Card>
  );
}

function ReservasSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-busy>
      {Array.from({ length: 3 }, (_, i) => (
        <Card key={i} className="overflow-hidden p-0">
          <div className="flex items-center gap-3.5 border-b border-outline-variant px-[22px] py-4">
            <Skeleton className="size-[42px] rounded-[10px]" />
            <div className="flex-1">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="mt-2 h-5 w-56" />
            </div>
          </div>
          <div className="flex flex-col gap-3 px-[22px] py-4">
            <Skeleton className="h-6" />
            <Skeleton className="h-6" />
          </div>
        </Card>
      ))}
    </div>
  );
}

function CabeceraSkeleton() {
  return (
    <div aria-busy>
      <Skeleton className="mb-[18px] h-4 w-40" />
      <div className="flex items-start gap-[18px]">
        <Skeleton className="size-[60px] rounded-[16px]" />
        <div className="flex-1">
          <Skeleton className="h-4 w-56" />
          <Skeleton className="mt-2 h-8 w-96 max-w-full" />
          <Skeleton className="mt-4 h-6 w-72 max-w-full" />
        </div>
      </div>
      <Skeleton className="mt-[26px] h-[90px] max-w-sm rounded-lg" />
      <Skeleton className="mt-4 h-[70px] rounded-lg" />
    </div>
  );
}

/** Barra de acciones sobre el día: reprogramarlo o cancelarlo. */
function AccionesDia({
  resumen, temporalidad, reprogramar, onCancelar,
}: {
  resumen: ResumenDia;
  temporalidad: Temporalidad;
  /** Ruta de la pantalla de reprogramación. */
  reprogramar: string;
  onCancelar: () => void;
}) {
  const cancelado = resumen.estadoDia === "cancelada";
  const cerrado = cancelado || temporalidad === "pasada" || resumen.estadoDia === "finalizada";
  // El backend sólo reprograma un día activo: uno ya reprogramado o cancelado no.
  const reprogramable = !cerrado && resumen.estadoDia === "activa";
  const fecha = <strong className="text-fg-1">{fechaCorta(resumen.fecha)}</strong>;

  return (
    <div className="mb-7 flex flex-wrap items-center justify-between gap-3.5 rounded-lg border border-outline-variant bg-surface px-5 py-4">
      <div className="flex min-w-0 items-center gap-[11px]">
        <Settings2 className="size-[18px] shrink-0 text-brown-700" />
        <span className="text-sm text-fg-2">
          {cancelado ? <>La jornada del {fecha} está cancelada</>
            : cerrado ? <>La jornada del {fecha} ya finalizó: no admite cambios</>
              : <>Gestioná la jornada del {fecha}</>}
        </span>
      </div>
      <div className="flex flex-wrap gap-2.5">
        {reprogramable ? (
          <Link href={reprogramar} className={buttonClasses({ variant: "neutral" })}>
            <CalendarClock className="size-[17px]" /> Reprogramar actividad del día
          </Link>
        ) : (
          <Button variant="neutral" disabled>
            <CalendarClock className="size-[17px]" /> Reprogramar actividad del día
          </Button>
        )}
        <Button
          variant="danger-outline"
          onClick={onCancelar}
          disabled={cerrado}
        >
          <CalendarX className="size-[17px]" /> Cancelar actividad del día
        </Button>
      </div>
    </div>
  );
}

const BANNER_ESTADO: Partial<Record<ResumenDia["estadoDia"], {
  titulo: string; badge: string; tono: "danger" | "warning"; etiqueta: string; borde: string; fondo: string; icono: React.ReactNode;
}>> = {
  cancelada: {
    titulo: "Actividad del día cancelada",
    badge: "Cancelada",
    tono: "danger",
    etiqueta: "Motivo de la cancelación",
    borde: "border-danger",
    fondo: "bg-danger-fill",
    icono: <CalendarX className="size-5 text-danger" />,
  },
  reprogramada: {
    titulo: "Actividad del día reprogramada",
    badge: "Reprogramada",
    tono: "warning",
    etiqueta: "Motivo de la reprogramación",
    borde: "border-warning",
    fondo: "bg-warning-fill",
    icono: <CalendarClock className="size-5 text-warning-fg" />,
  },
};

/** Aviso del estado del día con su motivo. Sólo para cancelado y reprogramado. */
function BannerEstadoDia({ resumen }: { resumen: ResumenDia }) {
  const meta = BANNER_ESTADO[resumen.estadoDia];
  if (!meta) return null;
  return (
    <div className={cn("mb-7 flex items-start gap-3.5 rounded-lg border px-5 py-4", meta.borde, meta.fondo)}>
      <div className={cn("flex size-10 shrink-0 items-center justify-center rounded-full border bg-surface", meta.borde)}>
        {meta.icono}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2.5">
          <strong className={cn("text-[15px]", meta.tono === "danger" ? "text-danger-fg" : "text-warning-fg")}>
            {meta.titulo}
          </strong>
          <EstadoBadge tone={meta.tono}>{meta.badge}</EstadoBadge>
        </div>
        {resumen.motivoEstado && (
          <>
            <div className="t-label mt-3 mb-1">{meta.etiqueta}</div>
            <p className="text-[14.5px] leading-normal break-words text-fg-1">{resumen.motivoEstado}</p>
          </>
        )}
      </div>
    </div>
  );
}

/* ---- Pantalla ----------------------------------------------------------- */

export default function ReservasDiaClient({ actividadId, diaId }: { actividadId: string; diaId: string }) {
  const { activo } = useEstablecimientos();
  const ruta = useRutaPanel();
  const establecimientoId = activo?.id ?? "";

  const [estado, setEstado] = useState<EstadoReservaDia | null>(null);
  const [page, setPage] = useState(0);

  const resumen = useResumenDia(establecimientoId, actividadId, diaId);
  const reservas = useReservasDia(establecimientoId, actividadId, diaId, { estado, page, size: PAGE_SIZE });
  const estados = useEstadosReservaDia(establecimientoId, actividadId, diaId);
  const { cancelar, cancelando } = useCancelarDia(establecimientoId, actividadId, diaId);

  const { generar, generando } = usePlanillaDia(establecimientoId, actividadId, diaId);

  const [modalCancelar, setModalCancelar] = useState(false);
  const [modalPlanilla, setModalPlanilla] = useState(false);

  // Al recargar después de cancelar, o al filtrar o paginar, sigue a la vista lo
  // último que llegó en vez de volver al esqueleto.
  const r = resumen.data ?? (resumen.isLoading ? resumen.ultimo : null);
  const hoy = hoyISO();
  const temporalidad = r?.fecha ? temporalidadDe(r.fecha, hoy) : "futura";
  // Los contadores del filtro también se recargan al cancelar: mientras tanto quedan los últimos.
  const conteo = estados.data ?? (estados.isLoading ? estados.ultimo : null);
  const opciones = opcionesFiltro(temporalidad, conteo ?? {});
  const pagina = reservas.data ?? (reservas.isLoading ? reservas.ultimo : null);
  const recargandoReservas = reservas.isLoading && pagina !== null;

  const volver = ruta("actividades", actividadId, "calendario") + (r?.fecha ? `?mes=${r.fecha.slice(0, 7)}` : "");

  function filtrar(e: EstadoReservaDia | null) {
    setEstado(e);
    setPage(0);
  }

  async function confirmarCancelacion(motivo: string): Promise<string | null> {
    // Se toma antes de recargar: después de cancelar ya no quedan pagadas.
    const pagadas = estados.data?.pagada ?? 0;
    const res = await cancelar(motivo);
    if (!res.ok) {
      // Si ya estaba finalizado o no existe, lo que se ve quedó viejo.
      if (res.code) resumen.reload();
      return mensajeErrorDias(res.code);
    }
    setModalCancelar(false);
    filtrar(null);
    resumen.reload();
    reservas.reload();
    estados.reload();
    // La cantidad de reembolsos es el dato para leer; sin pagadas no hay ninguno.
    if (pagadas > 0) {
      notify.successDetailed(
        "La actividad de este día se canceló",
        `Se ${pagadas === 1 ? "emitió 1 reembolso automático" : `emitieron ${pagadas} reembolsos automáticos`} a los visitantes.`,
      );
    } else {
      notify.success("La actividad de este día se canceló");
    }
    return null;
  }

  async function descargarPlanilla(formato: FormatoExport): Promise<string | null> {
    if (!r) return null;
    const res = await generar(r, formato);
    if (!res.ok) return res.mensaje ?? null;
    setModalPlanilla(false);
    notify.success(`Planilla descargada en ${formato.toUpperCase()}`);
    return null;
  }

  // Sólo las reservas que efectivamente vienen entran en la planilla.
  const paraPlanilla = ESTADOS_PLANILLA.reduce((n, e) => n + (conteo?.[e] ?? 0), 0);

  const cantidad = pagina?.totalElements ?? (estado ? conteo?.[estado] : r?.totalReservas);

  return (
    <div className="min-h-screen bg-cream-bg">
      <div className="mx-auto max-w-[1100px] px-7 pt-6 pb-20">
        {!establecimientoId && (
          <Alert className="mb-5">
            No hay un establecimiento seleccionado. Elegí uno en el menú lateral para ver las reservas.
          </Alert>
        )}

        <AsyncBoundary
          loading={!!establecimientoId && resumen.isLoading && !r}
          error={resumen.error}
          onRetry={resumen.reload}
          loadingLabel="Cargando el día…"
          skeleton={<CabeceraSkeleton />}
          pad={72}
        >
          {r && (
            <div aria-busy={resumen.isLoading || undefined}>
              <BackLink href={volver} className="mb-[18px]">
                Volver al calendario
              </BackLink>

              <div className="mb-1.5 flex flex-wrap items-start gap-[18px]">
                <div className="flex size-[60px] shrink-0 items-center justify-center rounded-[16px] border border-green-100 bg-green-050 text-green-700">
                  <IconoActividad cultivos={r.cultivos} className="size-[30px]" />
                </div>
                <div className="min-w-[260px] flex-[1_1_320px]">
                  {r.establecimiento && (
                    <div className="mb-1.5 flex items-center gap-2 text-[13px] text-fg-3">
                      <MapPin className="size-3.5 text-brown-700" />
                      <span>{[r.establecimiento, r.departamento].filter(Boolean).join(" · ")}</span>
                    </div>
                  )}
                  <h1 className="font-display text-[30px] leading-tight font-bold text-fg-1">{r.nombre}</h1>
                  <div className="mt-3.5 flex flex-wrap items-center gap-x-[22px] gap-y-2.5">
                    {r.fecha && (
                      <span className="inline-flex items-center gap-2 text-[14.5px] font-semibold text-fg-1">
                        <CalendarDays className="size-4 text-green-800" /> {fechaLarga(r.fecha)}
                      </span>
                    )}
                    {r.estadoDia === "cancelada" ? (
                      <EstadoBadge tone="danger">Cancelada</EstadoBadge>
                    ) : (
                      <EstadoBadge tone={TEMPORALIDAD[temporalidad].tono}>{TEMPORALIDAD[temporalidad].label}</EstadoBadge>
                    )}
                    {r.horaInicio && (
                      <span className="inline-flex items-center gap-2 text-[14.5px] font-semibold text-fg-1">
                        <Clock className="size-4 text-green-800" />
                        <span className="font-mono">{r.horaInicio} – {r.horaFin} h</span>
                      </span>
                    )}
                  </div>
                  {r.cultivos.length > 0 && (
                    <div className="mt-3.5">
                      <div className="t-label mb-[7px]">Cultivos asociados</div>
                      <div className="flex flex-wrap gap-[7px]">
                        {r.cultivos.map((c) => <CropChip key={c.id}>{c.nombre}</CropChip>)}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-[26px] mb-4 flex flex-wrap gap-4">
                <div className="flex min-w-[200px] flex-[0_1_380px] items-center gap-4 rounded-lg border border-outline-variant bg-surface p-5">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-[12px] border border-green-100 bg-green-050">
                    <Banknote className="size-[23px] text-green-700" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-mono text-[25px] leading-[1.05] font-semibold text-fg-1">{moneyAr(r.ingresoEstimado)}</div>
                    <div className="t-label mt-[7px]">Ingreso estimado del día</div>
                    <div className="mt-[3px] text-xs text-fg-3">
                      Reservas {temporalidad === "pasada" ? "finalizadas" : "pagadas"} + canceladas sin reembolso
                    </div>
                  </div>
                </div>
              </div>

              <AccionesDia
                resumen={r}
                temporalidad={temporalidad}
                reprogramar={ruta("actividades", actividadId, "calendario", diaId, "reprogramar")}
                onCancelar={() => setModalCancelar(true)}
              />

              <BannerEstadoDia resumen={r} />

              <div className="mb-[18px] flex flex-wrap items-end justify-between gap-4">
                <div>
                  <h2 className="font-display text-xl font-bold text-fg-1">Reservas del día</h2>
                  <p className="mt-[5px] text-sm text-fg-2">
                    {cantidad !== undefined && <>{cantidad} {cantidad === 1 ? "reserva" : "reservas"}</>}
                    {estado && ` · ${ESTADO_META[estado].label.toLowerCase()}`}
                  </p>
                </div>
                {r.totalReservas > 0 && (
                  <div className="flex w-full flex-wrap items-center gap-2.5 sm:w-auto">
                    {paraPlanilla > 0 && (
                      <Button variant="neutral" onClick={() => setModalPlanilla(true)} className="w-full sm:w-auto">
                        <Printer className="size-[17px]" /> Planilla del día
                      </Button>
                    )}
                    <FiltroEstado
                      value={estado}
                      onChange={filtrar}
                      opciones={opciones}
                      conteo={conteo}
                      total={r.totalReservas}
                    />
                  </div>
                )}
              </div>

              <AsyncBoundary
                loading={reservas.isLoading && !recargandoReservas}
                error={reservas.error}
                onRetry={reservas.reload}
                skeleton={<ReservasSkeleton />}
                pad={48}
              >
                {pagina && pagina.items.length === 0 ? (
                  <SinReservas filtrado={estado !== null} onLimpiar={() => filtrar(null)} />
                ) : (
                  pagina && (
                    <div aria-busy={recargandoReservas || undefined}>
                      <div className="flex flex-col gap-4">
                        {pagina.items.map((x) => <TarjetaReserva key={x.id} r={x} />)}
                      </div>
                      <Pagination page={page + 1} pages={pagina.totalPages} onPage={(n) => setPage(n - 1)} />
                    </div>
                  )
                )}
              </AsyncBoundary>
            </div>
          )}
        </AsyncBoundary>
      </div>

      {modalCancelar && r && (
        <CancelarDiaModal
          fecha={r.fecha}
          pagadas={estados.data ? (estados.data.pagada ?? 0) : null}
          cancelando={cancelando}
          onConfirmar={confirmarCancelacion}
          onCerrar={() => setModalCancelar(false)}
        />
      )}

      {modalPlanilla && r && (
        <PlanillaDiaDialog
          fecha={r.fecha}
          generando={generando}
          onDescargar={descargarPlanilla}
          onCerrar={() => setModalPlanilla(false)}
        />
      )}

    </div>
  );
}
