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
    // Las fotos NO están acá: se suben apenas se sueltan y tienen estado
    // propio (subiendo / error), que no es algo que react-hook-form modele
    // bien. Las administra `useFotosActividad` y viajan aparte al guardar.
    /** Con el que vino del backend: decide el texto del botón de publicar. */
    estado: z.enum(["publicado", "borrador"]),
  })
  .superRefine((v, ctx) => refinarTarifas(v.tarifas, ctx));

export type ActividadEditarForm = z.infer<typeof actividadEditarSchema>;
