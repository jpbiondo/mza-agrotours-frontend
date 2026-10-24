"use client";
import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, CalendarX } from "lucide-react";
import { Alert, Button, Modal } from "@/components/ui";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { TextArea } from "@/components/ui/text-area";
import { fechaLarga } from "@/lib/gestion-dias";
import { cn } from "@/lib/utils";
import {
  MOTIVO_MAX, cancelarDiaSchema, type CancelarDiaForm,
} from "@/app/panel/[establecimientoId]/actividades/[id]/calendario/[diaId]/schema";
import type { FechaISO } from "@/types/gestion-dias";

/**
 * Confirma la cancelación de un día. Con reservas pagadas avisa que se van a
 * reembolsar solas. `onConfirmar` devuelve el mensaje a mostrar si el backend
 * la rechazó, o `null` si se canceló.
 */
export function CancelarDiaModal({
  fecha, pagadas, cancelando, onConfirmar, onCerrar,
}: {
  fecha: FechaISO;
  /** Reservas pagadas del día; `null` si todavía no se sabe. */
  pagadas: number | null;
  cancelando: boolean;
  onConfirmar: (motivo: string) => Promise<string | null>;
  onCerrar: () => void;
}) {
  const [rechazo, setRechazo] = useState<string | null>(null);

  const form = useForm<CancelarDiaForm>({
    resolver: zodResolver(cancelarDiaSchema),
    mode: "onTouched",
    defaultValues: { motivo: "" },
  });
  const motivo = useWatch({ control: form.control, name: "motivo" });

  useEffect(() => { form.setFocus("motivo"); }, [form]);

  async function confirmar(v: CancelarDiaForm) {
    setRechazo(null);
    setRechazo(await onConfirmar(v.motivo.trim()));
  }

  const cerrar = () => { if (!cancelando) onCerrar(); };
  const restante = MOTIVO_MAX - motivo.length;

  return (
    <Modal onClose={cerrar} dismissable={!cancelando} className="w-[520px]">
      <div className="mb-[18px] flex gap-4">
        <div className="flex size-[46px] shrink-0 items-center justify-center rounded-full bg-danger-fill">
          <CalendarX className="size-[22px] text-danger" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="mb-1.5 font-display text-xl font-bold text-fg-1">Cancelar actividad del día</h2>
          <p className="text-[14.5px] leading-normal text-fg-2">
            Vas a cancelar la jornada del <strong className="text-fg-1">{fechaLarga(fecha)}</strong>. Esta acción no
            se puede deshacer.
          </p>
        </div>
      </div>

      {!!pagadas && (
        <Alert tone="warning" className="mb-[18px]">
          {pagadas === 1 ? (
            <>Existe <strong>1 reserva pagada</strong> para este día. </>
          ) : (
            <>Existen <strong>{pagadas} reservas pagadas</strong> para este día. </>
          )}
          Al cancelar la actividad, se emitirá un <strong>reembolso automático</strong> a los visitantes.
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(confirmar)} noValidate>
          <FormField
            control={form.control}
            name="motivo"
            render={({ field }) => (
              <FormItem>
                <FormLabel required>Motivo de la cancelación</FormLabel>
                <FormControl>
                  <TextArea
                    {...field}
                    rows={4}
                    maxLength={MOTIVO_MAX}
                    disabled={cancelando}
                    placeholder="Ej.: Pronóstico de lluvia y caminos anegados en la finca."
                  />
                </FormControl>
                <div className="flex min-h-[18px] items-start justify-between gap-3">
                  <FormMessage className="flex-1" />
                  <span
                    className={cn(
                      "ml-auto shrink-0 font-mono text-xs",
                      restante <= 20 ? "text-warning-fg" : "text-fg-3",
                    )}
                  >
                    {motivo.length}/{MOTIVO_MAX}
                  </span>
                </div>
              </FormItem>
            )}
          />

          {rechazo && <Alert className="mt-4">{rechazo}</Alert>}

          <div className="mt-[22px] flex flex-wrap justify-end gap-3">
            <Button variant="neutral" onClick={cerrar} disabled={cancelando}>
              <ArrowLeft className="size-4" /> Volver
            </Button>
            <Button type="submit" variant="danger" loading={cancelando}>
              <CalendarX className="size-[17px]" /> Confirmar cancelación
            </Button>
          </div>
        </form>
      </Form>
    </Modal>
  );
}
