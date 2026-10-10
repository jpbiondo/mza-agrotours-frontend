"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarPlus, Loader, X } from "lucide-react";
import { Alert, Button, Modal } from "@/components/ui";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { NumberField } from "@/components/ui/number-field";
import { TimePicker } from "@/components/ui/time-picker";
import { fechaLarga } from "@/lib/gestion-dias";
import { abrirDiaSchema, type AbrirDiaForm } from "@/app/panel/[establecimientoId]/actividades/[id]/dias/schema";
import type { AltaDia, FechaISO, Tarifa } from "@/types/gestion-dias";
import { CabeceraDia, NotaInfo, PieDialogo, PrecioContexto } from "./piezas";

/**
 * Abre a reservas una fecha libre. El horario arranca con el que la actividad
 * ya usa ese día de la semana, si tiene uno. `onAbrir` devuelve el mensaje a
 * mostrar si el backend lo rechazó, o `null` si se creó.
 */
export function AbrirDiaModal({
  fecha, cupoBase, horario, tarifas, guardando, onAbrir, onCerrar,
}: {
  fecha: FechaISO;
  cupoBase: number;
  horario: { horaInicio: string; horaFin: string } | null;
  tarifas: Tarifa[];
  guardando: boolean;
  onAbrir: (d: AltaDia) => Promise<string | null>;
  onCerrar: () => void;
}) {
  const [rechazo, setRechazo] = useState<string | null>(null);

  const form = useForm<AbrirDiaForm>({
    resolver: zodResolver(abrirDiaSchema),
    mode: "onTouched",
    defaultValues: {
      horaInicio: horario?.horaInicio ?? "",
      horaFin: horario?.horaFin ?? "",
      cupos: cupoBase > 0 ? String(cupoBase) : "",
    },
  });

  async function abrir(v: AbrirDiaForm) {
    setRechazo(null);
    setRechazo(await onAbrir({ fecha, horaInicio: v.horaInicio, horaFin: v.horaFin, cupoMax: Number(v.cupos) }));
  }

  const cerrar = () => { if (!guardando) onCerrar(); };

  return (
    <Modal onClose={cerrar} dismissable={!guardando} padding="p-0" className="flex max-h-[92vh] w-[540px] flex-col overflow-hidden">
      <CabeceraDia
        fecha={fecha}
        titulo="Abrir día de reservas"
        bajada={fechaLarga(fecha)}
        onCerrar={cerrar}
        cerrarDeshabilitado={guardando}
      />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(abrir)} noValidate className="flex min-h-0 flex-1 flex-col">
          <div className="flex flex-col gap-5 overflow-y-auto px-6 pt-5 pb-3">
            <div className="grid grid-cols-2 gap-2.5">
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
                  <FormLabel required>Cantidad de cupos</FormLabel>
                  <FormControl>
                    <NumberField {...field} className="max-w-[140px]" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <PrecioContexto tarifas={tarifas} />

            <NotaInfo>
              Se abrirá un nuevo día de reservas con estos valores. Podés modificar el cupo después desde el
              calendario.
            </NotaInfo>

            {rechazo && <Alert>{rechazo}</Alert>}
          </div>

          <PieDialogo className="justify-end">
            <Button variant="neutral" onClick={cerrar} disabled={guardando}>
              <X className="size-4" /> Cancelar
            </Button>
            <Button type="submit" disabled={guardando}>
              {guardando ? <><Loader className="spin size-4" /> Abriendo…</> : <><CalendarPlus className="size-4" /> Abrir día</>}
            </Button>
          </PieDialogo>
        </form>
      </Form>
    </Modal>
  );
}
