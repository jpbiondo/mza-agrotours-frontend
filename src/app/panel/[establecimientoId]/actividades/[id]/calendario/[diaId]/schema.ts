import { z } from "zod";

export const MOTIVO_MAX = 200;

/** Cancelación de un día: el motivo es obligatorio y le llega a los visitantes. */
export const cancelarDiaSchema = z.object({
  motivo: z
    .string()
    .trim()
    .min(1, "Ingresá el motivo de la cancelación para continuar.")
    .max(MOTIVO_MAX, `El motivo admite hasta ${MOTIVO_MAX} caracteres.`),
});

export type CancelarDiaForm = z.input<typeof cancelarDiaSchema>;
