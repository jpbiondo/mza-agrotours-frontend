import { z } from "zod";

export const RESENIA_MIN = 20;
export const RESENIA_MAX = 2000;

/** Valoración de una reserva. Los límites de la reseña son los de `CalificacionDTO` del backend. */
export const valoracionSchema = z.object({
  puntaje: z.number().int().min(1, "La calificación es requerida").max(5),
  // Opcional, pero si se escribe algo tiene que llegar al mínimo.
  resenia: z
    .string()
    .trim()
    .max(RESENIA_MAX, `La reseña puede tener hasta ${RESENIA_MAX} caracteres`)
    .refine((v) => v === "" || v.length >= RESENIA_MIN, `Escribí al menos ${RESENIA_MIN} caracteres, o dejala vacía`),
});

export type ValoracionForm = z.infer<typeof valoracionSchema>;
