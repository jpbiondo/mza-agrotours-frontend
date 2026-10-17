"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle, ArrowLeft, Banknote, Check, CreditCard, Hash, Loader, X } from "lucide-react";
import { Alert, Button, Modal } from "@/components/ui";
import { DatePicker, hoyISO } from "@/components/ui/date-picker";
import { FaltanCampos, useCamposFaltantes } from "@/components/ui/faltan-campos";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { TextField } from "@/components/ui/text-field";
import { TimePicker } from "@/components/ui/time-picker";
import { useRegistrarPagoReembolso } from "@/hooks/useImpagas";
import { fechaHoraLocal, fmtDiaLocal, fmtHoraLocal, moneyAr } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ReembolsoDetalle } from "@/types/impagas";
import { TEXTO_MAX, pagoSchema, type PagoForm } from "./schema";

/** Los campos del formulario en los que puede caer un `validationError` del backend. */
const CAMPO_FORM = { fecha: "fecha", metodo: "metodo", idExterno: "idExterno" } as const;

/**
 * Carga la transferencia con la que un administrador cubrió un reembolso impago.
 * Va en dos pasos —los datos y después la confirmación con el monto— porque el
 * pago no se puede deshacer.
 */
export function RegistrarPagoModal({ reembolso, onRegistrado, onDesactualizado, onCerrar }: {
  reembolso: ReembolsoDetalle;
  /** Con el detalle ya actualizado, o `null` si el backend no lo devolvió legible. */
  onRegistrado: (r: ReembolsoDetalle | null) => void;
  /** El reembolso dejó de estar impago, o de existir, mientras el modal estaba abierto. */
  onDesactualizado: (mensaje: string) => void;
  onCerrar: () => void;
}) {
  const { registrar, isLoading: guardando } = useRegistrarPagoReembolso();
  const [rechazo, setRechazo] = useState<string | null>(null);
  /** Los datos ya validados: con ellos, el modal pasa a la confirmación. */
  const [aConfirmar, setAConfirmar] = useState<PagoForm | null>(null);

  const form = useForm<PagoForm>({
    resolver: zodResolver(pagoSchema),
    // onChange y no onTouched: que la hora sea futura depende también del día,
    // y el error tiene que irse en cuanto se corrige cualquiera de los dos.
    mode: "onChange",
    defaultValues: { fecha: "", hora: "", metodo: "", idExterno: "" },
  });
  const metodo = useWatch({ control: form.control, name: "metodo" });
  const idExterno = useWatch({ control: form.control, name: "idExterno" });
  const { faltan, verQueFalta } = useCamposFaltantes(form, pagoSchema);

  const cerrar = () => { if (!guardando) onCerrar(); };

  async function confirmar() {
    if (!aConfirmar) return;
    const fecha = fechaHoraLocal(aConfirmar.fecha, aConfirmar.hora);
    if (!fecha) return;
    setRechazo(null);
    const r = await registrar(reembolso.id, { fecha, metodo: aConfirmar.metodo, idExterno: aConfirmar.idExterno });
    if (r.ok) {
      onRegistrado(r.reembolso ?? null);
      return;
    }
    if (r.code === "forbiddenState") {
      onDesactualizado(r.mensaje ?? "Este reembolso ya no está impago: puede que otro administrador ya lo haya pagado.");
      return;
    }
    if (r.code === "reembolsoNotFound" || r.status === 404) {
      onDesactualizado("Este reembolso ya no existe o dejó de estar impago.");
      return;
    }
    if (r.code === "validationError") {
      // De vuelta al formulario, con cada mensaje bajo su campo.
      setAConfirmar(null);
      for (const [campo, msg] of Object.entries(r.errores ?? {})) {
        form.setError(CAMPO_FORM[campo as keyof typeof CAMPO_FORM], { type: "server", message: msg });
      }
      setRechazo(r.otros?.length ? r.otros.join(" ") : null);
      return;
    }
    setRechazo(
      r.status === 403
        ? "No tenés permiso para registrar pagos de reembolsos."
        : "No pudimos registrar el pago. Probá de nuevo en unos minutos.",
    );
  }

  /** Contador de caracteres bajo un campo de texto, con el error a la izquierda. */
  const meta = (largo: number) => (
    <div className="flex min-h-5 items-center justify-between gap-3">
      <FormMessage />
      <span className={cn("ml-auto shrink-0 font-mono text-[11.5px]", largo >= TEXTO_MAX ? "text-danger" : "text-fg-3")}>
        {largo}/{TEXTO_MAX}
      </span>
    </div>
  );

  const cuando = aConfirmar ? fechaHoraLocal(aConfirmar.fecha, aConfirmar.hora) : null;

  return (
    <Modal onClose={cerrar} dismissable={!guardando} padding="p-0" className="flex max-h-[92vh] w-[520px] flex-col overflow-hidden">
      <div className="flex shrink-0 items-start justify-between gap-4 border-b border-outline-variant px-[26px] py-5">
        <div className="min-w-0">
          <span className="t-label mb-1.5 block">{aConfirmar ? "Confirmar pago" : "Registrar pago"}</span>
          <h2 className="font-display text-[20px] leading-tight font-bold text-fg-1">Agregar transferencia de reembolso</h2>
          <p className="mt-1.5 text-[13.5px] text-fg-2">
            Monto a reembolsar: <strong className="font-semibold text-fg-1">{moneyAr(reembolso.monto)}</strong>
          </p>
        </div>
        <button
          type="button"
          onClick={cerrar}
          disabled={guardando}
          aria-label="Cerrar"
          className="flex size-[42px] shrink-0 cursor-pointer items-center justify-center rounded-md border border-outline-variant bg-surface disabled:cursor-not-allowed disabled:opacity-50"
        >
          <X className="size-5 text-fg-2" />
        </button>
      </div>

      {aConfirmar ? (
        <>
          <div className="flex flex-col gap-4 overflow-y-auto px-[26px] py-[22px]">
            <div className="rounded-md border border-outline-variant bg-cream-tert px-4 py-3.5 text-center">
              <div className="t-label mb-1">Se registrará un pago de</div>
              <div className="font-display text-[30px] leading-none font-bold text-fg-1">{moneyAr(reembolso.monto)}</div>
            </div>
            <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-2.5 text-[14px]">
              <dt className="text-fg-3">Fecha y hora</dt>
              <dd className="font-mono text-fg-1">{cuando ? `${fmtDiaLocal(cuando)} · ${fmtHoraLocal(cuando)}` : "—"}</dd>
              <dt className="text-fg-3">Método</dt>
              <dd className="break-words text-fg-1">{aConfirmar.metodo}</dd>
              <dt className="text-fg-3">ID de la operación</dt>
              <dd className="font-mono break-all text-fg-1">{aConfirmar.idExterno}</dd>
            </dl>
            <Alert tone="warning" icon={<AlertTriangle size={18} />}>
              Esta acción no se puede deshacer. El reembolso quedará como pagado por el sistema, la reserva pasará a
              cancelada con reembolso y se le avisará al visitante.
            </Alert>
            {rechazo && <Alert>{rechazo}</Alert>}
          </div>
          <div className="flex shrink-0 flex-wrap justify-end gap-3 border-t border-outline-variant bg-cream-tert px-[26px] py-4">
            <Button variant="neutral" onClick={() => { setRechazo(null); setAConfirmar(null); }} disabled={guardando}>
              <ArrowLeft className="size-[17px]" /> Volver
            </Button>
            <Button onClick={confirmar} disabled={guardando}>
              {guardando ? <Loader className="spin size-[17px]" /> : <Check className="size-[17px]" />} Confirmar pago
            </Button>
          </div>
        </>
      ) : (
        <Form {...form}>
          <form
            noValidate
            onSubmit={form.handleSubmit((datos) => { setRechazo(null); setAConfirmar(datos); })}
            className="flex min-h-0 flex-1 flex-col"
          >
            <div className="flex flex-col gap-5 overflow-y-auto px-[26px] py-[22px]">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_150px]">
                <FormField
                  control={form.control}
                  name="fecha"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required>Fecha de la transferencia</FormLabel>
                      <FormControl>
                        <DatePicker {...field} max={hoyISO()} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="hora"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required>Hora</FormLabel>
                      <FormControl>
                        <TimePicker {...field} pasoMinutos={1} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="metodo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>Método de pago</FormLabel>
                    <FormControl>
                      <TextField
                        {...field}
                        icon={<CreditCard />}
                        maxLength={TEXTO_MAX}
                        placeholder="Ej.: Transferencia bancaria"
                      />
                    </FormControl>
                    {meta(metodo.length)}
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="idExterno"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>ID de la operación</FormLabel>
                    <FormControl>
                      <TextField
                        {...field}
                        icon={<Hash />}
                        maxLength={TEXTO_MAX}
                        placeholder="El número de operación en el medio que usaste"
                      />
                    </FormControl>
                    {meta(idExterno.length)}
                  </FormItem>
                )}
              />

              {rechazo && <Alert>{rechazo}</Alert>}
            </div>

            <div className="shrink-0 border-t border-outline-variant bg-cream-tert px-[26px] py-4">
              <div className="flex flex-wrap justify-end gap-3">
                <Button variant="neutral" onClick={cerrar}>
                  <X className="size-[17px]" /> Cancelar
                </Button>
                <Button type="submit" disabled={faltan > 0}>
                  <Banknote className="size-[17px]" /> Continuar
                </Button>
              </div>
              <FaltanCampos faltan={faltan} para="continuar" onVerQueFalta={verQueFalta} className="mt-2" />
            </div>
          </form>
        </Form>
      )}
    </Modal>
  );
}
