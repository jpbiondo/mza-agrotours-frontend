"use client";
import { useState } from "react";
import Link from "next/link";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertTriangle, CalendarCheck, CalendarClock, CalendarDays, CalendarRange, Check, Clock, MapPin, X,
} from "lucide-react";
import AsyncBoundary from "@/components/AsyncBoundary";
import { Alert, BackLink, Button, Card, Modal, ResultScreen, Skeleton } from "@/components/ui";
import { buttonClasses } from "@/components/ui/Button";
import { CalendarioFechas, hoyISO, sumarDiasISO } from "@/components/ui/date-picker";
import { FaltanCampos, useCamposFaltantes } from "@/components/ui/faltan-campos";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { TextArea } from "@/components/ui/text-area";
import { TimePicker } from "@/components/ui/time-picker";
import { useEstablecimientos, useRutaPanel } from "@/hooks/useEstablecimientos";
import { useCalendarioReprogramacion, useConfiguracionDias } from "@/hooks/useGestionDias";
import { useReprogramarDia, useResumenDia } from "@/hooks/useReservasDia";
import { fechaCorta, fechaLarga, mensajeErrorDias, moverMes, type Mes } from "@/lib/gestion-dias";
import { cn } from "@/lib/utils";
import type { DiaProgramado, FechaISO } from "@/types/gestion-dias";
import type { Reprogramacion, ResumenDia } from "@/types/reservas-dia";
import { MOTIVO_MAX, reprogramarSchema, type ReprogramarForm } from "./schema";

/** Si el backend no manda la ventana, es la misma que usa él para abrir días. */
const VENTANA_POR_DEFECTO = 120;

/**
 * El backend acepta un inicio anterior a «pago más antiguo + 120 días»: tomando
 * sólo la fecha, el último día seguro es el 119.
 */
const DIAS_DESDE_EL_PAGO = 119;

const LEYENDA: { muestra: string; label: string }[] = [
  { muestra: "border-green-800 bg-green-800", label: "Seleccionada" },
  { muestra: "border-dashed border-brown-500", label: "Día original" },
  { muestra: "border-green-300", label: "Hoy" },
  { muestra: "border-outline-variant bg-cream-tert", label: "Ocupado por otro día" },
];

/* ---- Piezas ------------------------------------------------------------- */

function Seccion({ children }: { children: React.ReactNode }) {
  return <section className="border-t border-outline-variant px-[30px] py-7 first:border-t-0">{children}</section>;
}

function Leyenda() {
  return (
    <div className="mt-4 flex flex-wrap gap-4 border-t border-cream-tert pt-3.5">
      {LEYENDA.map((l) => (
        <span key={l.label} className="inline-flex items-center gap-[7px] text-xs text-fg-2">
          <span className={cn("size-4 shrink-0 rounded-[5px] border bg-surface", l.muestra)} />
          {l.label}
        </span>
      ))}
      <span className="inline-flex items-center gap-[7px] text-xs text-fg-2">
        <span className="inline-flex size-4 shrink-0 items-center justify-center rounded-[5px] border border-outline-variant bg-surface text-[9px] text-fg-3 line-through">
          ×
        </span>
        No disponible
      </span>
    </div>
  );
}

function ConfirmarModal({ resumen, reprogramando, rechazo, onConfirmar, onCerrar }: {
  resumen: string;
  reprogramando: boolean;
  rechazo: string | null;
  onConfirmar: () => void;
  onCerrar: () => void;
}) {
  const cerrar = () => { if (!reprogramando) onCerrar(); };
  return (
    <Modal onClose={cerrar} dismissable={!reprogramando} className="w-[440px] text-center" padding="p-[30px_28px_24px]">
      <div className="mx-auto mb-[18px] flex size-14 items-center justify-center rounded-full bg-warning-fill">
        <AlertTriangle className="size-[26px] text-warning-fg" />
      </div>
      <h2 className="mb-2.5 font-display text-[21px] font-semibold text-fg-1">Confirmar reprogramación</h2>
      <p className="mb-5 text-[14.5px] leading-[1.55] text-fg-2">
        Este cambio <strong>notificará a los visitantes</strong>, quienes tendrán la opción de solicitar un reembolso
        total de su reserva. ¿Querés continuar?
      </p>
      <div className="mb-[22px] flex items-center gap-[9px] rounded-md border border-outline-variant bg-cream-tert px-3.5 py-3 text-left">
        <CalendarClock className="size-4 shrink-0 text-green-800" />
        <span className="text-[13.5px] text-fg-2">Nueva fecha y hora</span>
        <span className="ml-auto font-mono text-[13.5px] font-semibold text-fg-1">{resumen}</span>
      </div>
      {rechazo && <Alert className="mb-4 text-left">{rechazo}</Alert>}
      <div className="flex justify-center gap-2.5">
        <Button variant="neutral" onClick={cerrar} disabled={reprogramando}>
          <X className="size-4" /> Cancelar
        </Button>
        <Button onClick={onConfirmar} loading={reprogramando}>
          <Check className="size-4" /> Confirmar
        </Button>
      </div>
    </Modal>
  );
}

function Exito({ resumen, nuevo, calendario }: {
  resumen: ResumenDia;
  nuevo: Reprogramacion;
  calendario: string;
}) {
  return (
    <ResultScreen
      title="La actividad se reprogramó correctamente"
      action={
        <Link href={calendario} className={buttonClasses()}>
          <CalendarDays className="size-4" /> Ver calendario
        </Link>
      }
    >
      {[resumen.nombre, resumen.establecimiento].filter(Boolean).join(" — ")}
      <span className="mt-1 block font-semibold text-fg-1">
        {fechaLarga(nuevo.fecha)} · <span className="font-mono">{nuevo.horaInicio} – {nuevo.horaFin} h</span>
      </span>
    </ResultScreen>
  );
}

function ReprogramarSkeleton() {
  return (
    <div aria-busy>
      <Skeleton className="mb-[18px] h-4 w-48" />
      <div className="flex items-start gap-4">
        <Skeleton className="size-14 rounded-[16px]" />
        <div className="flex-1">
          <Skeleton className="h-4 w-56" />
          <Skeleton className="mt-2 h-8 w-96 max-w-full" />
        </div>
      </div>
      <Skeleton className="mt-[22px] h-[560px] rounded-lg" />
    </div>
  );
}

/* ---- Formulario --------------------------------------------------------- */

function Formulario({
  resumen, diaId, min, max, pagoMasAntiguo, mes, onMes, dias, volver, onListo, onCalendarioViejo, reprogramar,
  reprogramando,
}: {
  onCalendarioViejo: () => void;
  resumen: ResumenDia;
  diaId: string;
  min: FechaISO;
  max: FechaISO;
  pagoMasAntiguo: FechaISO | null;
  mes: Mes;
  onMes: (m: Mes) => void;
  /** Los días del mes visible; `null` mientras se piden. */
  dias: DiaProgramado[] | null;
  volver: string;
  onListo: (r: Reprogramacion) => void;
  reprogramar: (r: Reprogramacion) => Promise<{ ok: boolean; code?: string }>;
  reprogramando: boolean;
}) {
  const schema = reprogramarSchema({ fecha: resumen.fecha, horaInicio: resumen.horaInicio, min, max });
  const form = useForm<ReprogramarForm>({
    resolver: zodResolver(schema),
    // onChange: el aviso de «fin antes que inicio» se cruza entre dos campos y
    // tiene que aparecer apenas se mueve cualquiera de las dos horas.
    mode: "onChange",
    defaultValues: { fecha: resumen.fecha, horaInicio: resumen.horaInicio, horaFin: resumen.horaFin, motivo: "" },
  });
  const { faltan, datos } = useCamposFaltantes(form, schema);
  const [fecha, horaInicio, horaFin, motivo] = useWatch({
    control: form.control, name: ["fecha", "horaInicio", "horaFin", "motivo"],
  });

  const [aConfirmar, setAConfirmar] = useState<Reprogramacion | null>(null);
  const [rechazo, setRechazo] = useState<string | null>(null);

  // Fechas con otro día vigente: un día cancelado no ocupa la fecha, y el propio día tampoco.
  const ocupadas = new Set((dias ?? []).filter((d) => d.estado !== "cancelada" && d.id !== diaId).map((d) => d.fecha));
  const cambio = fecha !== resumen.fecha || horaInicio !== resumen.horaInicio || horaFin !== resumen.horaFin;

  function pedirConfirmacion(v: ReprogramarForm) {
    setRechazo(null);
    setAConfirmar({ fecha: v.fecha, horaInicio: v.horaInicio, horaFin: v.horaFin, motivo: v.motivo.trim() });
  }

  async function confirmar() {
    if (!aConfirmar) return;
    const r = await reprogramar(aConfirmar);
    if (r.ok) onListo(aConfirmar);
    else {
      // Alguien ocupó la fecha mientras se elegía: se trae el mes de nuevo para que se vea.
      if (r.code === "A.diaFechaOcupada") onCalendarioViejo();
      setRechazo(mensajeErrorDias(r.code));
    }
  }

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(pedirConfirmacion)} noValidate>
          <Card className="mt-[22px] overflow-hidden p-0">
            <Seccion>
              <div className="t-label">1 · Nueva fecha y horario</div>
              <p className="mt-1.5 text-[13.5px] text-fg-2">
                Por defecto queda seleccionado el día actual. Elegí una fecha posterior disponible o cambiá solo el
                horario: el día se puede postergar, no adelantar.
              </p>

              <div className="mt-[18px] flex flex-wrap gap-8">
                <div className="min-w-[300px] flex-[1_1_360px]">
                  <FormField
                    control={form.control}
                    name="fecha"
                    render={({ field }) => (
                      <FormItem>
                        <CalendarioFechas
                          tamano="amplio"
                          anio={mes.anio}
                          mes0={mes.mes0}
                          onMover={(delta) => onMes(moverMes(mes, delta))}
                          value={field.value}
                          onChange={(iso) => field.onChange(iso)}
                          min={min}
                          max={max}
                          original={resumen.fecha}
                          ocupada={(iso) => ocupadas.has(iso)}
                          cargando={!dias}
                          tituloBloqueado={(_, motivo) =>
                            motivo === "ocupada" ? "Ya hay otro día programado esa fecha" : "Fuera de la ventana para reprogramar"}
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Leyenda />
                  <Alert tone="warning" icon={<CalendarRange size={18} />} className="mt-3.5">
                    Fechas disponibles hasta el <strong>{fechaCorta(max)}</strong>
                    {pagoMasAntiguo && (
                      <span className="text-fg-3"> — 120 días desde el pago más antiguo ({fechaCorta(pagoMasAntiguo)}).</span>
                    )}
                  </Alert>
                </div>

                <div className="flex min-w-[240px] flex-[1_1_260px] flex-col gap-[18px]">
                  <div>
                    <div className="t-label mb-2">Fecha seleccionada</div>
                    <div className="flex flex-wrap items-center gap-[9px] rounded-md border border-green-100 bg-green-050 px-4 py-[13px] text-[14.5px] font-semibold text-fg-1">
                      <CalendarDays className="size-[17px] text-green-800" />
                      <span>{fechaLarga(fecha)}</span>
                      {fecha === resumen.fecha && (
                        <span className="ml-auto text-[11px] font-bold tracking-[.06em] text-brown-700 uppercase">Actual</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <div className="mb-[7px] text-[13.5px] font-medium text-fg-1">
                      Horario <span aria-hidden className="text-danger">*</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2.5">
                      <FormField
                        control={form.control}
                        name="horaInicio"
                        render={({ field }) => (
                          <FormItem className="gap-1.5">
                            <FormLabel className="text-[12.5px] font-normal text-fg-2">Hora de inicio</FormLabel>
                            <FormControl>
                              <TimePicker {...field} placeholder="Inicio" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="horaFin"
                        render={({ field }) => (
                          <FormItem className="gap-1.5">
                            <FormLabel className="text-[12.5px] font-normal text-fg-2">Hora de fin</FormLabel>
                            <FormControl>
                              <TimePicker {...field} placeholder="Fin" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </Seccion>

            <Seccion>
              <FormField
                control={form.control}
                name="motivo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>Motivo de la reprogramación</FormLabel>
                    <p className="mb-1.5 text-[13.5px] text-fg-2">Se incluye en la notificación que reciben los visitantes.</p>
                    <FormControl>
                      <TextArea
                        {...field}
                        rows={4}
                        maxLength={MOTIVO_MAX}
                        placeholder="Ej.: Pronóstico de lluvia intensa para la madrugada. Reubicamos la cosecha para garantizar la experiencia."
                      />
                    </FormControl>
                    <div className="flex min-h-[18px] items-start justify-between gap-3">
                      <FormMessage className="flex-1" />
                      <span className="ml-auto shrink-0 font-mono text-xs text-fg-3">{motivo.length}/{MOTIVO_MAX}</span>
                    </div>
                  </FormItem>
                )}
              />
            </Seccion>

            <div className="flex flex-wrap items-center justify-end gap-3 border-t border-outline-variant bg-cream-tert px-[30px] py-5">
              {!cambio && (
                <span className="mr-auto text-[13px] text-fg-3">Cambiá la fecha o el horario para reprogramar.</span>
              )}
              <div className="flex flex-col items-end gap-2">
                <div className="flex flex-wrap gap-3">
                  <Link href={volver} className={buttonClasses({ variant: "neutral" })}>
                    <X className="size-4" /> Cancelar
                  </Link>
                  <Button type="submit" disabled={!datos || !cambio}>
                    <CalendarCheck className="size-4" /> Confirmar reprogramación
                  </Button>
                </div>
                {cambio && <FaltanCampos faltan={faltan} para="reprogramar" />}
              </div>
            </div>
          </Card>
        </form>
      </Form>

      {aConfirmar && (
        <ConfirmarModal
          resumen={`${fechaCorta(aConfirmar.fecha)} · ${aConfirmar.horaInicio} – ${aConfirmar.horaFin} h`}
          reprogramando={reprogramando}
          rechazo={rechazo}
          onConfirmar={confirmar}
          onCerrar={() => setAConfirmar(null)}
        />
      )}
    </>
  );
}

/* ---- Pantalla ----------------------------------------------------------- */

export default function ReprogramarClient({ actividadId, diaId }: { actividadId: string; diaId: string }) {
  const { activo } = useEstablecimientos();
  const ruta = useRutaPanel();
  const establecimientoId = activo?.id ?? "";

  const resumen = useResumenDia(establecimientoId, actividadId, diaId);
  const conf = useConfiguracionDias(establecimientoId, actividadId);
  // Arranca en el mes del día; hasta que llega el resumen, en el actual.
  const [mesElegido, setMes] = useState<Mes | null>(null);
  const r = resumen.data;
  const mes: Mes = mesElegido ?? (r?.fecha
    ? { anio: Number(r.fecha.slice(0, 4)), mes0: Number(r.fecha.slice(5, 7)) - 1 }
    : { anio: new Date().getFullYear(), mes0: new Date().getMonth() });
  // Se pide recién con el resumen: antes no se sabe de qué mes es el día.
  const cal = useCalendarioReprogramacion(r?.fecha ? establecimientoId : "", actividadId, diaId, mes.anio, mes.mes0 + 1);
  // El pago más antiguo no cambia de un mes a otro: vale el último que llegó.
  const pagoMasAntiguo = (cal.data ?? cal.ultimo)?.pagoMasAntiguo ?? null;
  const { reprogramar, reprogramando } = useReprogramarDia(establecimientoId, actividadId, diaId);
  const [listo, setListo] = useState<Reprogramacion | null>(null);

  const hoy = hoyISO();
  // La ventana de apertura de días y, si hay reservas pagadas, además los 120 días desde el pago más antiguo.
  const ventana = conf.data?.fechaMaxima ?? sumarDiasISO(hoy, VENTANA_POR_DEFECTO);
  const max = pagoMasAntiguo ? [ventana, sumarDiasISO(pagoMasAntiguo, DIAS_DESDE_EL_PAGO)].sort()[0] : ventana;

  const volver = ruta("actividades", actividadId, "calendario", diaId);
  const calendario = ruta("actividades", actividadId, "calendario") + (listo ? `?mes=${listo.fecha.slice(0, 7)}` : "");
  // Sólo un día activo que todavía no pasó: es lo único que el backend acepta.
  const reprogramable = !!r && r.estadoDia === "activa" && r.fecha >= hoy;

  return (
    <div className="min-h-screen bg-cream-bg">
      <div className={cn("mx-auto px-7 pb-[100px]", listo ? "max-w-[1100px] pt-12" : "max-w-[920px] pt-6")}>
        {!establecimientoId && (
          <Alert className="mb-5">
            No hay un establecimiento seleccionado. Elegí uno en el menú lateral para reprogramar el día.
          </Alert>
        )}

        <AsyncBoundary
          // El primer calendario también hace falta: trae el pago más antiguo, que fija la fecha máxima.
          loading={!!establecimientoId && (resumen.isLoading || (!cal.data && !cal.ultimo && !cal.error))}
          error={resumen.error ?? cal.error}
          onRetry={() => { resumen.reload(); cal.reload(); }}
          loadingLabel="Cargando el día…"
          skeleton={<ReprogramarSkeleton />}
          pad={72}
        >
          {r && (listo ? (
            <Exito resumen={r} nuevo={listo} calendario={calendario} />
          ) : (
            <>
              <BackLink href={volver} className="mb-[18px]">
                Volver a las reservas del día
              </BackLink>

              <div className="mb-2.5 flex flex-wrap items-start gap-4">
                <div className="flex size-14 shrink-0 items-center justify-center rounded-[16px] border border-green-100 bg-green-050">
                  <CalendarClock className="size-7 text-green-700" />
                </div>
                <div className="min-w-[260px] flex-[1_1_320px]">
                  {r.establecimiento && (
                    <div className="mb-[5px] flex items-center gap-2 text-[13px] text-fg-3">
                      <MapPin className="size-3.5 text-brown-700" />
                      <span>{[r.establecimiento, r.departamento].filter(Boolean).join(" · ")}</span>
                    </div>
                  )}
                  <h1 className="font-display text-[30px] leading-tight font-bold text-fg-1">Reprogramar actividad del día</h1>
                  <p className="mt-2 text-[15px] text-fg-2">{r.nombre}</p>
                </div>
                <div className="shrink-0 rounded-md border border-outline-variant bg-surface px-4 py-3">
                  <div className="t-label mb-1.5">Programada actualmente</div>
                  <div className="flex items-center gap-2 text-sm font-semibold text-fg-1">
                    <CalendarDays className="size-[15px] text-brown-700" /> {fechaCorta(r.fecha)}
                    <span className="mx-0.5 text-outline">·</span>
                    <Clock className="size-[15px] text-brown-700" />
                    <span className="font-mono">{r.horaInicio} – {r.horaFin} h</span>
                  </div>
                </div>
              </div>

              {reprogramable ? (
                <Formulario
                  resumen={r}
                  diaId={diaId}
                  // El backend no deja adelantar el día: el piso es su propia fecha (que no pasó, o no sería reprogramable).
                  min={r.fecha}
                  max={max}
                  pagoMasAntiguo={pagoMasAntiguo}
                  mes={mes}
                  onMes={setMes}
                  dias={cal.data?.calendario.dias ?? null}
                  volver={volver}
                  onListo={setListo}
                  onCalendarioViejo={cal.reload}
                  reprogramar={reprogramar}
                  reprogramando={reprogramando}
                />
              ) : (
                <Alert className="mt-[22px]">
                  Este día no se puede reprogramar: sólo se reprograma un día activo que todavía no pasó.
                </Alert>
              )}
            </>
          ))}
        </AsyncBoundary>
      </div>
    </div>
  );
}
