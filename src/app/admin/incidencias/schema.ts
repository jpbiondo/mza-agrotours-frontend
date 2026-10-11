import { z } from "zod";
import { giEsTerminal } from "@/data/incidencias";

/** Tope de `DTOGestionIncidenciaRequest` y de la columna `motivo` de `IncidenciaEstado`. */
export const MOTIVO_MAX = 2000;

/**
 * Cambio de estado. El motivo es obligatorio sólo al cerrar la incidencia
 * (Resuelta o Desestimada), así que se valida contra el estado elegido.
 */
export const gestionSchema = z
  .object({
    estado: z.enum(["reportada", "revision", "resuelta", "desestimada"]),
    motivo: z
      .string()
      .trim()
      .max(MOTIVO_MAX, `El motivo no puede superar los ${MOTIVO_MAX} caracteres.`),
  })
  .superRefine((v, ctx) => {
    if (giEsTerminal(v.estado) && !v.motivo) {
      ctx.addIssue({ code: "custom", path: ["motivo"], message: "Ingresá el motivo para cerrar la incidencia." });
    }
  });

export type GestionForm = z.infer<typeof gestionSchema>;
