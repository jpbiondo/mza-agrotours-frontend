import { z } from "zod";
import type { DiaSemana } from "@/types/gestion-dias";

/* Los cupos se editan como texto —el input sólo deja escribir dígitos— y se
   convierten a número al guardar. Así un campo borrado es "" y no un 0 que el
   usuario nunca escribió. */
const cupos = z
  .string()
  .min(1, "Ingresá una cantidad de cupos.")
  .refine((v) => Number(v) > 0, "Los cupos tienen que ser más que 0.");

const hora = (mensaje: string) => z.string().regex(/^\d{2}:\d{2}$/, mensaje);

/** Fin posterior a inicio. "HH:MM" compara bien como texto. */
function horarioValido(v: { horaInicio: string; horaFin: string }, ctx: z.RefinementCtx) {
  if (v.horaInicio && v.horaFin && v.horaFin <= v.horaInicio) {
    ctx.addIssue({ code: "custom", path: ["horaFin"], message: "La hora de fin tiene que ser posterior a la de inicio." });
  }
}

/**
 * Cupo de un día. No puede quedar por debajo de las personas con reserva
 * vigente (pagadas + en espera de pago): el backend lo rechaza igual con
 * `A.cupoMenorAReservados`, pero así se avisa antes de mandar.
 */
export function cupoDiaSchema(minimo: number) {
  return z.object({
    cupos: cupos.refine(
      (v) => Number(v) >= minimo,
      `No podés bajar el cupo por debajo de ${minimo}, que son las personas con reserva vigente para este día.`,
    ),
  });
}

export type CupoDiaForm = z.infer<ReturnType<typeof cupoDiaSchema>>;

export const abrirDiaSchema = z
  .object({
    horaInicio: hora("Elegí la hora de inicio."),
    horaFin: hora("Elegí la hora de fin."),
    cupos,
  })
  .superRefine(horarioValido);

export type AbrirDiaForm = z.infer<typeof abrirDiaSchema>;

/**
 * Lote de días. La ventana de fechas (desde hoy hasta la fecha máxima) la
 * acota el propio selector, y las fechas que ya tienen día las descarta el
 * backend en la previsualización, así que acá sólo va lo que se sabe sin red.
 */
export const loteSchema = z
  .object({
    desde: z.string().min(1, "Elegí desde qué fecha."),
    hasta: z.string().min(1, "Elegí hasta qué fecha."),
    dias: z.array(z.custom<DiaSemana>()).min(1, "Elegí al menos un día de la semana."),
    horaInicio: hora("Elegí la hora de inicio."),
    horaFin: hora("Elegí la hora de fin."),
    cupos,
  })
  .superRefine((v, ctx) => {
    // "YYYY-MM-DD" también compara bien como texto.
    if (v.desde && v.hasta && v.hasta < v.desde) {
      ctx.addIssue({ code: "custom", path: ["hasta"], message: "La fecha hasta no puede ser anterior a la fecha desde." });
    }
    horarioValido(v, ctx);
  });

export type LoteForm = z.infer<typeof loteSchema>;
