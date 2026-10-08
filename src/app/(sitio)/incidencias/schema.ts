import { z } from "zod";

/** Topes del backend (`IncidenciaCreateRequest` y las columnas de `Incidencia`). */
export const TITULO_MAX = 50;
export const DESC_MAX = 1000;

const OBLIGATORIO = "Este campo es obligatorio";

export const incidenciaSchema = z.object({
  titulo: z
    .string()
    .trim()
    .min(1, OBLIGATORIO)
    .max(TITULO_MAX, `El título no puede superar los ${TITULO_MAX} caracteres.`),
  desc: z
    .string()
    .trim()
    .min(1, OBLIGATORIO)
    .max(DESC_MAX, `La descripción no puede superar los ${DESC_MAX} caracteres.`),
});

export type IncidenciaForm = z.infer<typeof incidenciaSchema>;

export const INCIDENCIA_INICIAL: IncidenciaForm = { titulo: "", desc: "" };
