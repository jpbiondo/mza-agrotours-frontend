"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle, Calendar, CalendarCheck, CalendarPlus, Check, Info, Loader, X } from "lucide-react";
import { Alert, Button, Panel } from "@/components/ui";
import { DatePicker, hoyISO } from "@/components/ui/date-picker";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { NumberField } from "@/components/ui/number-field";
import { TimePicker } from "@/components/ui/time-picker";
import { usePrevisualizacionLote } from "@/hooks/useGestionDias";
import { DIA_CORTO, ORDEN_DIAS, diaSemanaDe, fechaCorta, mensajeErrorDias } from "@/lib/gestion-dias";
import { cn } from "@/lib/utils";
import { loteSchema, type LoteForm } from "@/app/panel/[establecimientoId]/actividades/[id]/dias/schema";
import type { AltaLote, DiaSemana, FechaISO, PlanLote, Tarifa } from "@/types/gestion-dias";
import { BotonCerrar, PieDialogo, PrecioContexto } from "./piezas";

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <div className="t-label border-b border-cream-tert pb-2">{titulo}</div>
      {children}
    </section>
  );
}

/** Chips de días de la semana; se comporta como un grupo de casillas. */
function DiasSemana({
  id, value, onChange, onBlur, ref, "aria-invalid": ariaInvalid, "aria-describedby": describedBy,
}: {
  id?: string;
  value: DiaSemana[];
  onChange: (v: DiaSemana[]) => void;
  onBlur?: () => void;
  ref?: React.Ref<HTMLDivElement>;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
}) {
  const alternar = (d: DiaSemana) =>
    onChange(value.includes(d) ? value.filter((x) => x !== d) : ORDEN_DIAS.filter((x) => x === d || value.includes(x)));
  return (
    <div
      ref={ref}
      id={id}
      role="group"
      aria-label="Días de la semana"
      // `aria-invalid` no aplica a un grupo: el error se anuncia por el mensaje.
      aria-describedby={describedBy}
      onBlur={onBlur}
      className="flex flex-wrap gap-1.5"
    >
      {ORDEN_DIAS.map((d) => {
        const on = value.includes(d);
        return (
          <button
            key={d}
            type="button"
            aria-pressed={on}
            onClick={() => alternar(d)}
            className={cn(
              "cursor-pointer rounded-pill border px-3.5 py-2 text-[13.5px] font-semibold transition-colors",
              on ? "border-green-800 bg-green-800 text-fg-on-dark" : "border-sand bg-surface text-fg-1 hover:bg-cream-tert",
              ariaInvalid && !on && "border-danger",
            )}
          >
            {DIA_CORTO[d]}
          </button>
        );
      })}
    </div>
  );
}

function ChipsFechas({ fechas, tono }: { fechas: FechaISO[]; tono: "verde" | "aviso" }) {
  const MAX = 8;
  const restantes = fechas.length - MAX;
  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {fechas.slice(0, MAX).map((f) => (
        <span
          key={f}
          className={cn(
            "inline-flex items-center rounded-pill border bg-white/70 px-2.5 py-[5px] font-mono text-xs font-semibold",
            tono === "verde" ? "border-green-300 text-green-800" : "border-warning text-warning-fg",
          )}
        >
          {fechaCorta(f)} · {DIA_CORTO[diaSemanaDe(f)]}
        </span>
      ))}
      {restantes > 0 && (
        <span className="inline-flex items-center rounded-pill border border-dashed border-outline-variant px-2.5 py-[5px] text-xs text-fg-2 italic">
          Y {restantes} {restantes === 1 ? "día más" : "días más"}
        </span>
      )}
    </div>
  );
}

function Resumen({
  plan, cargando, code, fallo, completo,
}: { plan: PlanLote | null; cargando: boolean; code: string | null; fallo: boolean; completo: boolean }) {
  if (!completo) {
    return (
      <div className="flex items-center gap-2.5 rounded-md border border-dashed border-outline-variant bg-cream-tert p-3.5 text-[12.5px] text-fg-3">
        <Calendar className="size-[18px] shrink-0" />
        Cuando completes el rango, los días y el horario vas a ver acá qué días se crearán.
      </div>
    );
  }
  if (cargando) {
    return (
      <div className="flex items-center gap-2.5 rounded-md bg-cream-tert p-3.5 text-[12.5px] text-fg-2">
        <Loader className="spin size-4 shrink-0" /> Calculando los días…
      </div>
    );
  }
  if (fallo || !plan) {
    return <Alert>{code ? mensajeErrorDias(code) : "No pudimos calcular el resumen. Revisá los datos o probá de nuevo."}</Alert>;
  }
  if (plan.aCrear.length === 0 && plan.descartadas.length === 0) {
    return (
      <div className="flex items-center gap-2.5 rounded-md border border-dashed border-outline-variant bg-cream-tert p-3.5 text-[12.5px] text-fg-3">
        <Calendar className="size-[18px] shrink-0" />
        Ningún día del rango cae en los días de la semana elegidos.
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-3">
      {plan.aCrear.length > 0 && (
        <div className="rounded-[10px] border border-green-300 bg-green-050 p-3.5">
          <div className="flex items-center gap-2 text-[13.5px]">
            <CalendarCheck className="size-4 text-green-800" />
            <strong className="text-green-800">
              {plan.aCrear.length} {plan.aCrear.length === 1 ? "día se creará" : "días se crearán"}
            </strong>
          </div>
          <ChipsFechas fechas={plan.aCrear} tono="verde" />
        </div>
      )}
      {plan.descartadas.length > 0 && (
        <div className="rounded-[10px] border border-warning bg-warning-fill p-3.5">
          <div className="flex items-center gap-2 text-[13.5px]">
            <AlertTriangle className="size-4 text-warning-fg" />
            <strong className="text-warning-fg">
              {plan.descartadas.length}{" "}
              {plan.descartadas.length === 1 ? "día se descarta" : "días se descartan"}
            </strong>
          </div>
          <p className="mt-1.5 text-[12.5px] leading-normal text-warning-fg">
            Estas fechas ya tienen un día programado o su horario ya pasó. Se mantiene el día original: para
            cambiarle el cupo, editalo desde el calendario.
          </p>
          <ChipsFechas fechas={plan.descartadas} tono="aviso" />
        </div>
      )}
    </div>
  );
}

/**
 * Abre días en lote: un rango, los días de la semana y un horario. El resumen
 * lo calcula el backend en vivo (`/lote/previsualizacion`) y lo vuelve a
 * calcular al guardar, así que lo que se ve es lo que se va a crear.
 * `onCrear` devuelve el mensaje a mostrar si el backend lo rechazó, o `null`.
 */
export function LoteDrawer({
  establecimientoId, actividadId, actividad, cupoBase, diasSugeridos, horario, fechaMaxima, ventanaDias,
  tarifas, guardando, onCrear, onCerrar,
}: {
  establecimientoId: string;
  actividadId: string;
  actividad: string;
  cupoBase: number;
  diasSugeridos: DiaSemana[];
  horario: { horaInicio: string; horaFin: string } | null;
  fechaMaxima: FechaISO;
  ventanaDias: number;
  tarifas: Tarifa[];
  guardando: boolean;
  onCrear: (l: AltaLote) => Promise<string | null>;
  onCerrar: () => void;
}) {
  const [rechazo, setRechazo] = useState<string | null>(null);
  const hoy = hoyISO();

  const form = useForm<LoteForm>({
    resolver: zodResolver(loteSchema),
    mode: "onTouched",
    defaultValues: {
      desde: "",
      hasta: "",
      dias: diasSugeridos,
      horaInicio: horario?.horaInicio ?? "",
      horaFin: horario?.horaFin ?? "",
      cupos: cupoBase > 0 ? String(cupoBase) : "",
    },
  });

  // La previsualización sale en cuanto el formulario es válido, sin esperar al blur.
  const valores = useWatch({ control: form.control });
  const parseado = loteSchema.safeParse(valores);
  const lote: AltaLote | null = parseado.success
    ? {
        desde: parseado.data.desde,
        hasta: parseado.data.hasta,
        dias: parseado.data.dias,
        horaInicio: parseado.data.horaInicio,
        horaFin: parseado.data.horaFin,
        cupoMax: Number(parseado.data.cupos),
      }
    : null;
  const preview = usePrevisualizacionLote(establecimientoId, actividadId, lote);
  const aCrear = preview.plan?.aCrear.length ?? 0;
  const desde = valores.desde ?? "";

  async function crear(v: LoteForm) {
    setRechazo(null);
    setRechazo(await onCrear({
      desde: v.desde, hasta: v.hasta, dias: v.dias, horaInicio: v.horaInicio, horaFin: v.horaFin, cupoMax: Number(v.cupos),
    }));
  }

  const cerrar = () => { if (!guardando) onCerrar(); };

  return (
    <Panel onClose={cerrar} lado="derecha" width="w-[600px]">
      <div className="flex items-start justify-between gap-3.5 border-b border-outline-variant px-6 pt-[22px] pb-[18px]">
        <div>
          <div className="flex items-center gap-2">
            <CalendarPlus className="size-[18px] text-green-800" />
            <h2 className="font-display text-[19px] font-semibold text-fg-1">Agregar días en lote</h2>
          </div>
          <p className="mt-2 text-[13px] leading-normal text-fg-2">
            Definí un rango de fechas y los días de la semana en que se abrirán nuevos días de reserva para
            «{actividad}».
          </p>
        </div>
        <BotonCerrar onClick={cerrar} disabled={guardando} />
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(crear)} noValidate className="flex min-h-0 flex-1 flex-col">
          <div className="flex flex-1 flex-col gap-6 overflow-y-auto px-6 py-5">
            <Seccion titulo="Rango de fechas">
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="desde"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required>Desde</FormLabel>
                      <FormControl>
                        <DatePicker {...field} min={hoy} max={fechaMaxima} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="hasta"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required>Hasta</FormLabel>
                      <FormControl>
                        <DatePicker {...field} min={desde || hoy} max={fechaMaxima} disabled={!desde} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="flex items-start gap-1.5 text-[11.5px] text-fg-3">
                <Info className="mt-px size-[13px] shrink-0" />
                <span>
                  Podés abrir días desde hoy hasta el {fechaCorta(fechaMaxima)} — máximo {ventanaDias} días a futuro.
                  Si superás la vigencia actual, se extiende.
                </span>
              </div>
            </Seccion>

            <Seccion titulo="Días de la semana">
              <FormField
                control={form.control}
                name="dias"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <DiasSemana {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </Seccion>

            <Seccion titulo="Horario y cupos">
              <div className="grid grid-cols-[1.5fr_1fr] gap-2.5">
                <div className="grid grid-cols-2 gap-2">
                  <FormField
                    control={form.control}
                    name="horaInicio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel required>Inicio</FormLabel>
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
                      <FormItem>
                        <FormLabel required>Fin</FormLabel>
                        <FormControl>
                          <TimePicker {...field} placeholder="Fin" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="cupos"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required>Cupos</FormLabel>
                      <FormControl>
                        <NumberField {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <PrecioContexto tarifas={tarifas} className="mt-1" />
            </Seccion>

            <Seccion titulo="Resumen">
              <Resumen
                plan={preview.plan}
                cargando={preview.isLoading}
                code={preview.code}
                fallo={preview.fallo}
                completo={lote !== null}
              />
            </Seccion>

            {rechazo && <Alert>{rechazo}</Alert>}
          </div>

          <PieDialogo>
            <span className="text-[12.5px] text-fg-3">
              {aCrear > 0 ? (
                <>
                  <CalendarCheck className="mr-1 inline size-[13px] align-[-1px] text-green-800" />
                  Se crearán <strong className="text-green-800">{aCrear}</strong> {aCrear === 1 ? "día" : "días"}
                  {preview.plan && preview.plan.descartadas.length > 0 && `, ${preview.plan.descartadas.length} descartados`}
                </>
              ) : lote ? (
                preview.isLoading ? "Calculando…" : "Sin días para crear con esta combinación"
              ) : (
                "Definí el rango y los días"
              )}
            </span>
            <div className="flex gap-2.5">
              <Button variant="neutral" onClick={cerrar} disabled={guardando}>
                <X className="size-4" /> Cancelar
              </Button>
              {/* Con el formulario incompleto se deja enviar: así RHF marca qué falta. */}
              <Button type="submit" disabled={guardando || (lote !== null && aCrear === 0)}>
                {guardando ? (
                  <><Loader className="spin size-4" /> Creando…</>
                ) : (
                  <><Check className="size-4" /> Crear{aCrear > 0 && ` ${aCrear} ${aCrear === 1 ? "día" : "días"}`}</>
                )}
              </Button>
            </div>
          </PieDialogo>
        </form>
      </Form>
    </Panel>
  );
}
