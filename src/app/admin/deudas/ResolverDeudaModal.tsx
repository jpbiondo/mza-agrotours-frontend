"use client";
import { useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle, ArrowLeft, Check, CreditCard, Handshake, HandCoins, Hash, X } from "lucide-react";
import { Alert, Button, IconButton, Modal } from "@/components/ui";
import { Checkbox } from "@/components/ui/checkbox";
import { DatePicker, hoyISO } from "@/components/ui/date-picker";
import { FaltanCampos, useCamposFaltantes } from "@/components/ui/faltan-campos";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { NumberField } from "@/components/ui/number-field";
import { TextArea } from "@/components/ui/text-area";
import { TextField } from "@/components/ui/text-field";
import { TimePicker } from "@/components/ui/time-picker";
import { pendienteDe } from "@/data/deudas";
import { useResolverDeuda, type CampoResolverDeuda } from "@/hooks/useDeudas";
import { fechaHoraLocal, fmtDiaLocal, fmtHoraLocal, moneyAr } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Deuda, DeudaDetalle, TipoResolucionDeuda } from "@/types/deudas";
import {
  MOTIVO_MAX, TEXTO_MAX, aCentavos, leerMonto, llevaPago, resolverDeudaSchema, type ResolverDeudaForm,
} from "./schema";

const TIPOS: { id: TipoResolucionDeuda; label: string; texto: string; icon: React.ReactNode }[] = [
  {
    id: "devolucion",
    label: "Devolución",
    texto: "El establecimiento devolvió parte o todo lo que debe.",
    icon: <HandCoins className="size-[18px]" />,
  },
  {
    id: "acuerdo",
    label: "Acuerdo medio",
    texto: "Se pactó un monto menor: el resto se condona y la deuda se cierra.",
    icon: <Handshake className="size-[18px]" />,
  },
];

/** Selector de tipo con radios nativos: el teclado y el lector de pantalla salen solos. */
function TipoSelector({ id, value, onChange, "aria-describedby": describedBy }: {
  id?: string;
  value: TipoResolucionDeuda;
  onChange: (v: TipoResolucionDeuda) => void;
  "aria-describedby"?: string;
}) {
  return (
    <div id={id} role="radiogroup" aria-describedby={describedBy} className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
      {TIPOS.map((t) => {
        const on = value === t.id;
        return (
          <label
            key={t.id}
            className={cn(
              "flex cursor-pointer flex-col gap-1 rounded-md border px-3.5 py-3 transition-colors has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/50",
              on ? "border-green-800 bg-green-050" : "border-outline-variant bg-surface hover:bg-cream-tert",
            )}
          >
            <input type="radio" name="tipo-resolucion" value={t.id} checked={on} onChange={() => onChange(t.id)} className="sr-only" />
            <span className={cn("flex items-center gap-2 text-[14.5px] font-semibold", on ? "text-green-800" : "text-fg-1")}>
              {t.icon} {t.label}
            </span>
            <span className="text-[12.5px] leading-snug text-fg-2">{t.texto}</span>
          </label>
        );
      })}
    </div>
  );
}

/** Lo que va a pasar con la deuda, para decirlo antes de confirmar. */
function resultado(tipo: TipoResolucionDeuda, monto: number, pendiente: number): string {
  if (tipo === "acuerdo") return "La deuda se cerrará; no se podrá registrar nada más.";
  const resta = (aCentavos(pendiente) - aCentavos(monto)) / 100;
  return resta > 0 ? `Devolución parcial; restarán ${moneyAr(resta)}.` : "La deuda quedará saldada.";
}

/**
 * Registra una devolución o un acuerdo medio sobre una deuda abierta. Va en dos
 * pasos —los datos y después la confirmación con el resultado— porque el cambio
 * de estado no se puede deshacer. Sirve desde la lista y desde el detalle: sólo
 * necesita los montos y el estado, que ya trae la fila.
 */
export function ResolverDeudaModal({ deuda, onResuelta, onDesactualizado, onCerrar }: {
  deuda: Deuda;
  /** Con el detalle ya actualizado, o `null` si el backend no lo devolvió legible. */
  onResuelta: (d: DeudaDetalle | null) => void;
  /** La deuda cambió o dejó de existir mientras el modal estaba abierto: hay que volver a pedirla. */
  onDesactualizado: (mensaje: string) => void;
  onCerrar: () => void;
}) {
  const { resolver, isLoading: guardando } = useResolverDeuda();
  const [rechazo, setRechazo] = useState<string | null>(null);
  /** Los datos ya validados: con ellos, el modal pasa a la confirmación. */
  const [aConfirmar, setAConfirmar] = useState<ResolverDeudaForm | null>(null);

  const pendiente = pendienteDe(deuda);
  const schema = useMemo(() => resolverDeudaSchema(pendiente), [pendiente]);
  const form = useForm<ResolverDeudaForm>({
    resolver: zodResolver(schema),
    // onChange y no onTouched: qué campos son obligatorios depende del tipo y del
    // "Agregar pago", y que la hora sea futura depende también del día; los
    // errores tienen que acomodarse en cuanto cambia cualquiera.
    mode: "onChange",
    defaultValues: { tipo: "devolucion", motivo: "", conPago: false, fecha: "", hora: "", monto: "", metodo: "", idExterno: "" },
  });
  const tipo = useWatch({ control: form.control, name: "tipo" });
  const conPago = useWatch({ control: form.control, name: "conPago" });
  const motivo = useWatch({ control: form.control, name: "motivo" });
  const metodo = useWatch({ control: form.control, name: "metodo" });
  const idExterno = useWatch({ control: form.control, name: "idExterno" });
  const { faltan, verQueFalta } = useCamposFaltantes(form, schema);
  const conPagoVisible = llevaPago({ tipo, conPago });

  const cerrar = () => { if (!guardando) onCerrar(); };

  async function confirmar() {
    if (!aConfirmar) return;
    const fecha = fechaHoraLocal(aConfirmar.fecha, aConfirmar.hora);
    const monto = leerMonto(aConfirmar.monto);
    const pago = llevaPago(aConfirmar) && fecha && monto !== null
      ? { fecha, monto, metodo: aConfirmar.metodo.trim(), idExterno: aConfirmar.idExterno.trim() }
      : null;
    setRechazo(null);
    const r = await resolver(deuda.id, { tipo: aConfirmar.tipo, motivo: aConfirmar.motivo.trim(), pago });
    if (r.ok) {
      onResuelta(r.deuda ?? null);
      return;
    }
    // También es un 409, pero no cambió la deuda: se cargó dos veces la misma
    // transferencia. Va antes del 409 genérico y deja corregir el ID en el formulario.
    if (r.code === "Deuda.pagoDuplicado") {
      setAConfirmar(null);
      form.setError("idExterno", {
        type: "server",
        message: r.mensaje ?? "Ya se registró un pago con ese ID externo para esta deuda.",
      });
      return;
    }
    if (r.code === "Deuda.finalizada" || r.status === 409) {
      onDesactualizado("Esta deuda ya está saldada o cerrada: puede que otro administrador la haya resuelto.");
      return;
    }
    if (r.code === "Deuda.montoInvalido") {
      onDesactualizado("El monto supera lo que queda por devolver: puede que otro administrador haya registrado un pago. Revisá el saldo actualizado.");
      return;
    }
    if (r.code === "entityNotFound" || r.status === 404) {
      onDesactualizado("Esta deuda ya no existe.");
      return;
    }
    if (r.code === "validationError" || r.code === "Deuda.pagoObligatorio") {
      // De vuelta al formulario, con cada mensaje bajo su campo.
      setAConfirmar(null);
      for (const [campo, msg] of Object.entries(r.errores ?? {})) {
        form.setError(campo as CampoResolverDeuda, { type: "server", message: msg });
      }
      setRechazo(
        r.code === "Deuda.pagoObligatorio"
          ? "Una devolución tiene que llevar el pago."
          : r.otros?.length ? r.otros.join(" ") : null,
      );
      return;
    }
    setRechazo(
      r.status === 403
        ? "No tenés permiso para resolver deudas."
        : "No pudimos registrar el cambio. Probá de nuevo en unos minutos.",
    );
  }

  /** Contador de caracteres bajo un campo de texto, con el error a la izquierda. */
  const meta = (largo: number, max: number) => (
    <div className="flex min-h-5 items-center justify-between gap-3">
      <FormMessage />
      <span className={cn("ml-auto shrink-0 font-mono text-[11.5px]", largo >= max ? "text-danger" : "text-fg-3")}>
        {largo}/{max}
      </span>
    </div>
  );

  const cuando = aConfirmar ? fechaHoraLocal(aConfirmar.fecha, aConfirmar.hora) : null;
  const montoConfirmado = aConfirmar && llevaPago(aConfirmar) ? leerMonto(aConfirmar.monto) : null;

  return (
    <Modal onClose={cerrar} dismissable={!guardando} padding="p-0" className="flex max-h-[92vh] w-[560px] flex-col overflow-hidden">
      <div className="flex shrink-0 items-start justify-between gap-4 border-b border-outline-variant px-[26px] py-5">
        <div className="min-w-0">
          <span className="t-label mb-1.5 block">{aConfirmar ? "Confirmar cambio" : "Resolver deuda"}</span>
          <h2 className="font-display text-[20px] leading-tight font-bold break-words text-fg-1">{deuda.deudor || "Deuda"}</h2>
          <p className="mt-1.5 text-[13.5px] text-fg-2">
            Queda por devolver: <strong className="font-semibold text-fg-1">{moneyAr(pendiente)}</strong>
            <span className="text-fg-3"> de {moneyAr(deuda.montoTotal)}</span>
          </p>
        </div>
        <IconButton onClick={cerrar} disabled={guardando} aria-label="Cerrar">
          <X />
        </IconButton>
      </div>

      {aConfirmar ? (
        <>
          <div className="flex flex-col gap-4 overflow-y-auto px-[26px] py-[22px]">
            <div className="rounded-md border border-outline-variant bg-cream-tert px-4 py-3.5 text-center">
              <div className="t-label mb-1">{aConfirmar.tipo === "acuerdo" ? "Acuerdo medio" : "Devolución"}</div>
              <div className="font-display text-[30px] leading-none font-bold text-fg-1">
                {montoConfirmado !== null ? moneyAr(montoConfirmado) : "Sin pago"}
              </div>
            </div>
            <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-2.5 text-[14px]">
              <dt className="text-fg-3">Motivo</dt>
              <dd className="break-words whitespace-pre-line text-fg-1">{aConfirmar.motivo.trim()}</dd>
              {montoConfirmado !== null && (
                <>
                  <dt className="text-fg-3">Fecha y hora</dt>
                  <dd className="font-mono text-fg-1">{cuando ? `${fmtDiaLocal(cuando)} · ${fmtHoraLocal(cuando)}` : "—"}</dd>
                  <dt className="text-fg-3">Método</dt>
                  <dd className="break-words text-fg-1">{aConfirmar.metodo.trim()}</dd>
                  <dt className="text-fg-3">ID de la operación</dt>
                  <dd className="font-mono break-all text-fg-1">{aConfirmar.idExterno.trim()}</dd>
                </>
              )}
            </dl>
            <Alert tone="warning" icon={<AlertTriangle size={18} />}>
              <strong className="font-semibold">{resultado(aConfirmar.tipo, montoConfirmado ?? 0, pendiente)}</strong>{" "}
              Esta acción no se puede deshacer, y se les avisará a los productores del establecimiento.
            </Alert>
            {rechazo && <Alert>{rechazo}</Alert>}
          </div>
          <div className="flex shrink-0 flex-wrap justify-end gap-3 border-t border-outline-variant bg-cream-tert px-[26px] py-4">
            <Button variant="neutral" onClick={() => { setRechazo(null); setAConfirmar(null); }} disabled={guardando}>
              <ArrowLeft className="size-[17px]" /> Volver
            </Button>
            <Button onClick={confirmar} loading={guardando}>
              <Check className="size-[17px]" /> Confirmar
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
              <FormField
                control={form.control}
                name="tipo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>Tipo de resolución</FormLabel>
                    <FormControl>
                      <TipoSelector value={field.value} onChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="motivo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>Motivo</FormLabel>
                    <FormControl>
                      <TextArea
                        {...field}
                        rows={3}
                        maxLength={MOTIVO_MAX}
                        placeholder={tipo === "acuerdo" ? "Ej.: Se acordó cerrar la deuda con un pago del 50%" : "Ej.: Transferencia del productor"}
                      />
                    </FormControl>
                    {meta(motivo.length, MOTIVO_MAX)}
                  </FormItem>
                )}
              />

              {tipo === "acuerdo" && (
                <FormField
                  control={form.control}
                  name="conPago"
                  render={({ field }) => (
                    <FormItem>
                      <label className="flex cursor-pointer items-center gap-3 rounded-md border border-outline-variant bg-surface px-4 py-3">
                        <Checkbox
                          ref={field.ref}
                          checked={field.value}
                          onCheckedChange={(ck) => field.onChange(ck === true)}
                          onBlur={field.onBlur}
                          className="size-5"
                        />
                        <span className="text-[14px] text-fg-1">
                          Agregar pago
                          <span className="block text-[12.5px] text-fg-3">Si como parte del acuerdo el establecimiento pagó algo.</span>
                        </span>
                      </label>
                    </FormItem>
                  )}
                />
              )}

              {conPagoVisible && (
                <div className="flex flex-col gap-5 rounded-md border border-outline-variant bg-cream-tert/50 p-4">
                  <FormField
                    control={form.control}
                    name="monto"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel required>Monto del pago</FormLabel>
                        <FormControl>
                          <NumberField {...field} decimales={2} placeholder="Ej.: 4000,50" />
                        </FormControl>
                        <div className="flex min-h-5 flex-wrap items-center justify-between gap-x-3 gap-y-1">
                          <FormMessage />
                          {/* El caso más común en una devolución: que paguen todo lo que falta. */}
                          <button
                            type="button"
                            onClick={() => form.setValue("monto", String(pendiente).replace(".", ","), { shouldValidate: true, shouldDirty: true })}
                            className="ml-auto cursor-pointer text-[12.5px] font-semibold text-green-800 underline underline-offset-2"
                          >
                            Usar el saldo pendiente ({moneyAr(pendiente)})
                          </button>
                        </div>
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_150px]">
                    <FormField
                      control={form.control}
                      name="fecha"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel required>Fecha del pago</FormLabel>
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
                          <TextField {...field} icon={<CreditCard />} maxLength={TEXTO_MAX} placeholder="Ej.: Transferencia bancaria" />
                        </FormControl>
                        {meta(metodo.length, TEXTO_MAX)}
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
                          <TextField {...field} icon={<Hash />} maxLength={TEXTO_MAX} placeholder="El número de operación en el medio que se usó" />
                        </FormControl>
                        {meta(idExterno.length, TEXTO_MAX)}
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {rechazo && <Alert>{rechazo}</Alert>}
            </div>

            <div className="shrink-0 border-t border-outline-variant bg-cream-tert px-[26px] py-4">
              <div className="flex flex-wrap justify-end gap-3">
                <Button variant="neutral" onClick={cerrar}>
                  <X className="size-[17px]" /> Cancelar
                </Button>
                <Button type="submit" disabled={faltan > 0}>
                  <Check className="size-[17px]" /> Continuar
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
