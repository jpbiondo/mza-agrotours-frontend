import { z } from "zod";
import { EMAIL_RE } from "@/data/auth";
import { diasHasta } from "@/lib/productores";

/**
 * Alta de productor. Que la cuenta exista y que no sea ya productora de este
 * establecimiento se resuelve contra el backend (ver `useUsuarioCard` y el
 * chequeo contra la lista vigente), así que acá sólo se valida lo que se puede
 * saber sin red.
 */
export const nuevoProductorSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Ingresá el correo electrónico de la persona.")
    .regex(EMAIL_RE, "Escribí un correo electrónico válido."),
  rolId: z.string().min(1, "Elegí un rol para asignar al productor."),
});

export type NuevoProductorForm = z.infer<typeof nuevoProductorSchema>;

export const NUEVO_PRODUCTOR_INICIAL: NuevoProductorForm = { email: "", rolId: "" };

/**
 * Suspensión temporal. `hasta` llega como AAAA-MM-DD del `<input type="date">` y
 * se compara por día calendario: al backend se le manda el final de ese día
 * (ver `finDelDia`), así que elegir hoy es válido.
 */
export const suspensionSchema = z.object({
  motivo: z
    .string()
    .trim()
    .min(1, "Escribí el motivo de la suspensión.")
    .min(10, "Detallá un poco más el motivo (al menos 10 caracteres)."),
  hasta: z
    .string()
    .min(1, "Elegí la fecha de fin prevista.")
    .refine((f) => {
      const dias = diasHasta(f);
      return dias !== null && dias >= 0;
    }, "La fecha de fin no puede ser anterior a hoy."),
});

export type SuspensionForm = z.infer<typeof suspensionSchema>;

/** Levantamiento anticipado: el motivo queda registrado con la suspensión. */
export const levantarSchema = z.object({
  motivo: z.string().trim().min(1, "Escribí el motivo del levantamiento."),
});

export type LevantarForm = z.infer<typeof levantarSchema>;
