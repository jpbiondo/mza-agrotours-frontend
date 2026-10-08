"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle, Check, Clock, Info, Loader, RotateCcw, Users, X } from "lucide-react";
import { Alert, Button, Modal } from "@/components/ui";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { NumberField } from "@/components/ui/number-field";
import { fechaLarga } from "@/lib/gestion-dias";
import { cn } from "@/lib/utils";
import { cupoDiaSchema, type CupoDiaForm } from "@/app/panel/[establecimientoId]/actividades/[id]/dias/schema";
import type { DiaProgramado, Tarifa } from "@/types/gestion-dias";
import { BarraCupos } from "./CalendarioMensual";
import { CabeceraDia, PieDialogo, PrecioContexto } from "./piezas";

/**
 * Cambia el cupo de un día programado. Sólo el cupo: el precio es uno para
 * toda la actividad y se cambia desde «Modificar». `onGuardar` devuelve el
 * mensaje a mostrar si el backend lo rechazó, o `null` si se guardó.
 */
export function EditarCupoModal({
  dia, actividad, cupoBase, tarifas, guardando, onGuardar, onCerrar,
}: {
  dia: DiaProgramado;
  actividad: string;
  cupoBase: number;
  tarifas: Tarifa[];
  guardando: boolean;
  onGuardar: (cupo: number) => Promise<string | null>;
  onCerrar: () => void;
}) {
  // Pagadas y en espera retienen el cupo: es el mínimo al que se puede bajar.
  const reservados = dia.pagadas + dia.pendientes;
  const [rechazo, setRechazo] = useState<string | null>(null);

  const form = useForm<CupoDiaForm>({
    resolver: zodResolver(cupoDiaSchema(reservados)),
    mode: "onTouched",
    defaultValues: { cupos: String(dia.cupoMax) },
  });
  const cupos = useWatch({ control: form.control, name: "cupos" });
  const sinCambios = Number(cupos) === dia.cupoMax;

  const lleno = reservados >= dia.cupoMax;
  const ocupacion = dia.cupoMax > 0 ? Math.round((reservados / dia.cupoMax) * 100) : 0;

  async function guardar(v: CupoDiaForm) {
    setRechazo(null);
    setRechazo(await onGuardar(Number(v.cupos)));
  }

  const cerrar = () => { if (!guardando) onCerrar(); };

  return (
    <Modal onClose={cerrar} dismissable={!guardando} padding="p-0" className="flex max-h-[92vh] w-[540px] flex-col overflow-hidden">
      <CabeceraDia
        fecha={dia.fecha}
        titulo={fechaLarga(dia.fecha)}
        bajada={
          <>
            {actividad} · <Clock className="ml-0.5 size-3 text-fg-3" /> {dia.horaInicio} – {dia.horaFin}
          </>
        }
        onCerrar={cerrar}
        cerrarDeshabilitado={guardando}
      />

      <div className="border-b border-outline-variant bg-cream-tert px-6 py-4">
        <div className="flex items-start gap-3">
          <Users className={cn("size-[18px] shrink-0", lleno ? "text-warning-fg" : "text-green-800")} />
          <div className="min-w-0 flex-1">
            <div className="mb-[5px] flex items-baseline justify-between gap-3">
              <span className="text-xs font-semibold tracking-[.05em] text-fg-2 uppercase">Reservas vigentes</span>
              <span className="font-mono text-sm text-fg-1">
                <strong>{reservados}</strong> de {dia.cupoMax}
                <span className="ml-1 font-normal text-fg-3">({ocupacion}%)</span>
              </span>
            </div>
            <BarraCupos
              pagadas={dia.pagadas}
              pendientes={dia.pendientes}
              cupoMax={dia.cupoMax}
              className="h-1.5 rounded-[3px] border border-outline-variant bg-surface"
            />
            <div className="mt-1.5 text-xs text-fg-3">
              {dia.pagadas} {dia.pagadas === 1 ? "pagada" : "pagadas"} · {dia.pendientes} en espera de pago
            </div>
          </div>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(guardar)} noValidate className="flex min-h-0 flex-1 flex-col">
          <div className="flex flex-col gap-5 overflow-y-auto px-6 pt-[22px] pb-3">
            <PrecioContexto tarifas={tarifas} />

            <FormField
              control={form.control}
              name="cupos"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between gap-3">
                    <FormLabel>Cantidad de cupos</FormLabel>
                    {Number(field.value) !== cupoBase && cupoBase >= reservados && (
                      <button
                        type="button"
                        onClick={() => form.setValue("cupos", String(cupoBase), { shouldValidate: true, shouldTouch: true })}
                        className="inline-flex cursor-pointer items-center gap-1 text-[11.5px] text-fg-2 hover:text-fg-1"
                      >
                        <RotateCcw className="size-[11px]" /> Restaurar al cupo base ({cupoBase})
                      </button>
                    )}
                  </div>
                  <FormControl>
                    <NumberField {...field} stepper min={reservados} className="max-w-[200px]" />
                  </FormControl>
                  <FormMessage />
                  {!form.formState.errors.cupos && (
                    <div className="mt-0.5 flex items-start gap-1.5 rounded-md bg-info-fill px-2.5 py-2 text-xs leading-normal text-info-fg">
                      <AlertTriangle className="mt-px size-3.5 shrink-0 text-warning-fg" />
                      <span>
                        Mínimo permitido: <strong className="font-mono">{reservados}</strong> · No podés bajar el
                        cupo por debajo de las reservas vigentes.
                      </span>
                    </div>
                  )}
                </FormItem>
              )}
            />

            {rechazo && <Alert>{rechazo}</Alert>}
          </div>

          <PieDialogo>
            <span className="flex items-center gap-1.5 text-xs text-fg-3">
              <Info className="size-[13px]" /> El cambio de cupo sólo se aplica a este día.
            </span>
            <div className="flex gap-2.5">
              <Button variant="neutral" onClick={cerrar} disabled={guardando}>
                <X className="size-4" /> Cancelar
              </Button>
              <Button type="submit" disabled={guardando || sinCambios}>
                {guardando ? <><Loader className="spin size-4" /> Guardando…</> : <><Check className="size-4" /> Guardar cambios</>}
              </Button>
            </div>
          </PieDialogo>
        </form>
      </Form>
    </Modal>
  );
}
