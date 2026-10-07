import { z } from "zod";

/** Topes del backend (`FaqAMRequest` y las columnas de `FAQ`). */
export const PREGUNTA_MAX = 160;
export const RESPUESTA_MAX = 700;

/** Alta y edición de una entrada de la base de conocimiento. */
export const faqSchema = z.object({
  q: z
    .string()
    .trim()
    .min(1, "Ingresá la pregunta.")
    .max(PREGUNTA_MAX, `La pregunta no puede superar los ${PREGUNTA_MAX} caracteres.`),
  a: z
    .string()
    .trim()
    .min(1, "Ingresá la respuesta.")
    .max(RESPUESTA_MAX, `La respuesta no puede superar los ${RESPUESTA_MAX} caracteres.`),
  cat: z.string().min(1, "Elegí una categoría."),
});

export type FaqForm = z.infer<typeof faqSchema>;

export const FAQ_INICIAL: FaqForm = { q: "", a: "", cat: "general" };
