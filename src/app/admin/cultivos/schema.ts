import { z } from "zod";
import { erroresNutricion } from "@/components/admin/gcr/nutricion";
import type { Estacion, UnidadNutricional } from "@/types/gestionCr";

/**
 * Caracteres que acepta el nombre del lado del backend (`@SinCaracteresEspeciales`):
 * letras con acentos, números, espacios, guion medio y guion bajo.
 */
const NOMBRE_VALIDO = /^[a-zA-Z0-9áéíóúüÁÉÍÓÚÜñÑ _-]*$/;

/** Comparable entre nombres: sin mayúsculas ni espacios de más. */
const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");

/**
 * Alta y edición de un tipo de cultivo. Es una función porque el nombre no
 * puede repetir el de otro cultivo del catálogo (sin contar el que se edita).
 *
 * La imagen no está acá: se sube apenas se elige y tiene estado propio
 * (subiendo / error), que maneja `useImagenUnica`.
 */
export function cultivoSchema(nombresOcupados: string[]) {
  const ocupados = new Set(nombresOcupados.map(norm));

  return z
    .object({
      nombre: z
        .string()
        .trim()
        .min(1, "Ingresá el nombre del cultivo.")
        .max(60, "El nombre es demasiado largo.")
        .regex(NOMBRE_VALIDO, "Usá solo letras, números, espacios, guiones y guiones bajos.")
        .refine((v) => !ocupados.has(norm(v)), "Ya existe un cultivo con ese nombre. Elegí otro."),
      descripcion: z.string().trim().min(1, "Escribí una breve descripción del cultivo."),
      // El backend pide al menos uno de cada cosa: un beneficio cargado y un mes
      // de cosecha. Validarlo acá evita mandar un formulario que ya sabemos rechazado.
      beneficios: z
        .array(z.string())
        .refine((bs) => bs.some((b) => b.trim()), "Cargá al menos un beneficio."),
      calendario: z
        .array(z.custom<Estacion>())
        .refine(
          (c) => c.includes("h"),
          "Marcá al menos un mes de cosecha: es lo que define la temporada del cultivo.",
        ),
      porcionReferencia: z.string(),
      informacionNutricional: z.array(
        z.object({ nombre: z.string(), valor: z.string(), unidad: z.custom<UnidadNutricional>() }),
      ),
    })
    // Las reglas nutricionales viven en `erroresNutricion`, junto al editor que
    // las muestra; acá sólo se traducen a issues con el path de cada campo.
    .superRefine((v, ctx) => {
      const e = erroresNutricion(v.porcionReferencia, v.informacionNutricional);
      if (e.porcion) ctx.addIssue({ code: "custom", path: ["porcionReferencia"], message: e.porcion });
      e.filas.forEach((message, i) => {
        if (message) ctx.addIssue({ code: "custom", path: ["informacionNutricional", i], message });
      });
      if (e.global) ctx.addIssue({ code: "custom", path: ["informacionNutricional"], message: e.global });
    });
}

export type CultivoForm = z.infer<ReturnType<typeof cultivoSchema>>;
