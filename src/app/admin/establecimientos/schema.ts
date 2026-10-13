import { z } from "zod";

export const MOTIVO_MIN = 15;
export const MOTIVO_MAX = 280;

/** Suspensión de un establecimiento: el titular ve el motivo que se registra. */
export const suspensionEstabSchema = z.object({
  motivo: z
    .string()
    .trim()
    .min(1, "Escribí el motivo de la suspensión.")
    .min(MOTIVO_MIN, `El motivo debe tener al menos ${MOTIVO_MIN} caracteres.`)
    .max(MOTIVO_MAX, `El motivo no puede superar los ${MOTIVO_MAX} caracteres.`),
});

export type SuspensionEstabForm = z.infer<typeof suspensionEstabSchema>;
