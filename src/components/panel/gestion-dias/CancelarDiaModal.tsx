"use client";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Alert } from "@/components/ui";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { FaltanCampos, useCamposFaltantes } from "@/components/ui/faltan-campos";
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
  const { faltan } = useCamposFaltantes(form, cancelarDiaSchema);

  async function confirmar(v: CancelarDiaForm) {
    setRechazo(null);
    setRechazo(await onConfirmar(v.motivo.trim()));
  }

  const restante = MOTIVO_MAX - motivo.length;

  return (
    <ConfirmDialog
      open
      title="Cancelar actividad del día"
      description={
        <>
          Vas a cancelar la jornada del <strong className="text-fg-1">{fechaLarga(fecha)}</strong>. Esta acción no
          se puede deshacer.
        </>
      }
      confirmLabel="Cancelar día"
      busy={cancelando}
      error={rechazo}
      confirmDisabled={faltan > 0}
      onCancel={onCerrar}
      onConfirm={form.handleSubmit(confirmar)}
    >
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
        <FaltanCampos faltan={faltan} para="cancelar el día" className="mt-2" />
      </Form>
    </ConfirmDialog>
  );
}
