import { z } from "zod";
import type { FechaISO } from "@/types/gestion-dias";

export const MOTIVO_MAX = 200;

/**
 * Reprogramación de un día. La fecha arranca en la que ya tenía y puede quedar
 * igual si cambia sólo el horario; si cambia, tiene que caer en `[min, max]`.
 * Que haya cambiado algo no es un error de campo: la pantalla lo avisa aparte.
 */
export function reprogramarSchema(original: { fecha: FechaISO; min: FechaISO; max: FechaISO }) {
  return z
    .object({
      fecha: z.string().min(1, "Elegí la nueva fecha."),
      horaInicio: z.string().regex(/^\d{2}:\d{2}$/, "Elegí la hora de inicio."),
      horaFin: z.string().regex(/^\d{2}:\d{2}$/, "Elegí la hora de fin."),
      motivo: z
        .string()
        .trim()
        .min(1, "El motivo es obligatorio.")
        .max(MOTIVO_MAX, `El motivo admite hasta ${MOTIVO_MAX} caracteres.`),
    })
    .superRefine((v, ctx) => {
      // "YYYY-MM-DD" compara bien como texto.
      if (v.fecha && v.fecha !== original.fecha && (v.fecha < original.min || v.fecha > original.max)) {
        ctx.addIssue({ code: "custom", path: ["fecha"], message: "La fecha está fuera de la ventana permitida." });
      }
      if (v.horaInicio && v.horaFin && v.horaFin <= v.horaInicio) {
        ctx.addIssue({ code: "custom", path: ["horaFin"], message: "La hora de fin tiene que ser posterior a la de inicio." });
      }
      // El backend pide que el nuevo inicio sea futuro: sólo puede fallar si la fecha es hoy.
      if (v.fecha && v.horaInicio && `${v.fecha}T${v.horaInicio}` <= ahoraLocal()) {
        ctx.addIssue({ code: "custom", path: ["horaInicio"], message: "Ese horario ya pasó: elegí uno posterior." });
      }
    });
}

/** "YYYY-MM-DDTHH:MM" de ahora, en hora local. */
function ahoraLocal(): string {
  const d = new Date();
  const p2 = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}T${p2(d.getHours())}:${p2(d.getMinutes())}`;
}

export type ReprogramarForm = z.infer<ReturnType<typeof reprogramarSchema>>;
