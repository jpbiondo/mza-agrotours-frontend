import { z } from "zod";
import { camposComunes, refinarTarifas } from "@/lib/actividad-form";

/**
 * Modificación de una actividad (POST .../actividades/edit/{id}).
 *
 * No tiene cupos, días ni vigencia: el endpoint de edición no los recibe —la
 * disponibilidad se maneja desde el calendario de la actividad—. El resto de
 * las reglas sale de `camposComunes`, que comparte con el alta.
 */
export const actividadEditarSchema = z
  .object({
    ...camposComunes,
    /** Fotos que siguen en el storage; quitarlas de la lista es borrarlas. */
    fotos: z.array(z.object({ key: z.string(), nombre: z.string(), url: z.string().optional() })),
    /** Fotos recién elegidas, todavía sin subir. */
    nuevas: z.array(z.custom<File>()),
    /** Con el que vino del backend: decide el texto del botón de publicar. */
    estado: z.enum(["publicado", "borrador"]),
  })
  .superRefine((v, ctx) => refinarTarifas(v.tarifas, ctx));

export type ActividadEditarForm = z.infer<typeof actividadEditarSchema>;
