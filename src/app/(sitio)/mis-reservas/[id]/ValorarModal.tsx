"use client";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { MapPin, Send, Star, Users, X } from "lucide-react";
import Photo, { seedDeId } from "@/components/landing/Photo";
import { Button, IconButton, Modal } from "@/components/ui";
import { FaltanCampos, useCamposFaltantes } from "@/components/ui/faltan-campos";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { StarRating } from "@/components/ui/star-rating";
import { TextArea } from "@/components/ui/text-area";
import { useValorarReserva } from "@/hooks/useReservas";
import type { ErrorValoracion, ReservaDetalle } from "@/types/reservas";
import { RESENIA_MAX, valoracionSchema, type ValoracionForm } from "./schema";

/** Copy propio para cada error: el `message` del backend no se muestra. */
const MENSAJE_ERROR: Record<ErrorValoracion, string> = {
  noFinalizada: "Sólo podés valorar actividades finalizadas.",
  yaValorada: "Ya valoraste esta actividad.",
  noEncontrada: "No encontramos esta reserva entre las tuyas.",
  invalida: "Revisá la calificación y la reseña, y volvé a intentarlo.",
  tecnico: "No pudimos registrar tu valoración. Revisá tu conexión y volvé a intentarlo.",
};

/**
 * Con estos errores reintentar no sirve: la reserva cambió en el backend. Se
 * cierra el modal y la pantalla la vuelve a pedir. Con el resto, el modal
 * queda abierto y conserva lo escrito.
 */
const DEFINITIVO: Record<ErrorValoracion, boolean> = {
  noFinalizada: true, yaValorada: true, noEncontrada: true, invalida: false, tecnico: false,
};

export type ResultadoValoracion = { ok: true } | { ok: false; mensaje: string; definitivo: boolean };

/** Modal para calificar con estrellas y, opcionalmente, dejar una reseña. */
export default function ValorarModal({
  reserva, onClose, onResultado,
}: {
  reserva: ReservaDetalle;
  onClose: () => void;
  /** Avisa cómo terminó el envío; la pantalla decide si cierra y qué toast muestra. */
  onResultado: (r: ResultadoValoracion) => void;
}) {
  const { valorar, enviando } = useValorarReserva(reserva.id);
  const form = useForm<ValoracionForm>({
    resolver: zodResolver(valoracionSchema),
    defaultValues: { puntaje: 0, resenia: "" },
    mode: "onTouched",
  });
  const puntaje = useWatch({ control: form.control, name: "puntaje" });
  const resenia = useWatch({ control: form.control, name: "resenia" });
  const { faltan } = useCamposFaltantes(form, valoracionSchema);

  async function onValid(data: ValoracionForm) {
    const r = await valorar(data.puntaje, data.resenia);
    onResultado(r.ok ? { ok: true } : { ok: false, mensaje: MENSAJE_ERROR[r.error], definitivo: DEFINITIVO[r.error] });
  }

  const cerrar = () => { if (!enviando) onClose(); };

  return (
    <Modal onClose={cerrar} dismissable={!enviando} padding="p-0" className="flex max-h-[calc(100vh-48px)] w-[560px] flex-col">
      <div className="flex items-center justify-between border-b border-cream-tert px-5 pt-4 pb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="flex size-[30px] items-center justify-center rounded-lg bg-green-050 text-brown-700">
            <Star size={17} />
          </div>
          <h2 className="font-display text-lg font-bold text-fg-1">Valorar actividad</h2>
        </div>
        <IconButton onClick={cerrar} disabled={enviando} aria-label="Cerrar">
          <X />
        </IconButton>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onValid)} noValidate className="flex min-h-0 flex-1 flex-col">
          <div className="overflow-y-auto px-6 pt-5 pb-1">
            <div className="flex items-center gap-4">
              <div className="size-[76px] shrink-0 overflow-hidden rounded-xl">
                <Photo seed={seedDeId(reserva.actividadId || reserva.id)} height={76} radius={0} src={reserva.foto?.url} alt="" />
              </div>
              <div className="min-w-0">
                <h3 className="font-display text-[19px] leading-[1.22] font-bold text-fg-1">
                  {reserva.actividad || "Actividad sin nombre"}
                </h3>
                {reserva.establecimiento && (
                  <div className="mt-1.5 flex items-center gap-1.5 text-[13.5px] text-fg-2">
                    <MapPin size={14} className="shrink-0 text-brown-700" />
                    <span className="truncate">{reserva.establecimiento}</span>
                  </div>
                )}
                <div className="mt-1 flex items-center gap-1.5 text-[13px] text-fg-3">
                  <Users size={14} className="shrink-0" />
                  {reserva.personas} {reserva.personas === 1 ? "participante" : "participantes"}
                </div>
              </div>
            </div>

            <div className="my-5 h-px bg-cream-tert" />

            <FormField
              control={form.control}
              name="puntaje"
              render={({ field }) => (
                <FormItem className="gap-3">
                  <FormLabel required className="t-label">CALIFICACIÓN GENERAL</FormLabel>
                  <div className="flex items-center gap-3.5">
                    <FormControl>
                      <StarRating {...field} label="Calificación general" size={40} disabled={enviando} className="gap-2" />
                    </FormControl>
                    {puntaje > 0 && <span className="font-mono text-sm font-semibold text-fg-2">{puntaje}/5</span>}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="resenia"
              render={({ field }) => (
                <FormItem className="mt-6">
                  <FormLabel optional className="t-label">TU COMENTARIO</FormLabel>
                  <FormControl>
                    <TextArea
                      {...field}
                      placeholder="Contá a otros cómo fue tu experiencia"
                      maxLength={RESENIA_MAX}
                      disabled={enviando}
                    />
                  </FormControl>
                  <div className="flex items-start justify-between gap-3">
                    <FormMessage />
                    <span className="ml-auto shrink-0 font-mono text-[11.5px] text-fg-3">
                      {resenia.length}/{RESENIA_MAX}
                    </span>
                  </div>
                </FormItem>
              )}
            />
          </div>

          <div className="mt-4 flex gap-3 border-t border-cream-tert px-6 pt-4 pb-[18px]">
            <Button type="submit" className="flex-1" disabled={faltan > 0} loading={enviando}>
              <Send size={16} aria-hidden />
              Enviar
            </Button>
            <Button variant="neutral" className="min-w-[130px]" onClick={cerrar} disabled={enviando}>
              Cancelar
            </Button>
          </div>
          {/* Lo obligatorio es la calificación, que está a la vista: sin "Ver qué falta". */}
          <FaltanCampos faltan={faltan} para="enviar" className="-mt-2 justify-start px-6 pb-[18px]" />
        </form>
      </Form>
    </Modal>
  );
}
