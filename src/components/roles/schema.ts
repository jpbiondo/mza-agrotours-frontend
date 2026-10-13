import { z } from "zod";

/** Comparable entre nombres: sin mayúsculas ni espacios de más. */
const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");

/**
 * Alta y modificación de un rol, de administrador o de productor. Es una
 * función porque depende de dónde se use: el largo máximo del nombre sale de
 * los textos de cada pantalla, y los nombres ocupados, de los roles que ya
 * existen en ese ámbito (sin el que se está editando).
 */
export function rolSchema(maxNombre: number, nombresOcupados: string[]) {
  const ocupados = new Set(nombresOcupados.map(norm));

  return z.object({
    nombre: z
      .string()
      .trim()
      .min(1, "Escribí un nombre para el rol.")
      .min(3, "El nombre debe tener al menos 3 letras.")
      .max(maxNombre, `El nombre no puede superar los ${maxNombre} caracteres.`)
      .refine((v) => !ocupados.has(norm(v)), "Ya existe un rol con ese nombre. Elegí otro."),
    descripcion: z
      .string()
      .trim()
      .min(1, "Escribí una descripción para el rol.")
      .max(200, "La descripción no puede superar los 200 caracteres."),
    permisos: z.array(z.string()).min(1, "Marcá al menos un permiso para el rol."),
  });
}

export type RolForm = z.infer<ReturnType<typeof rolSchema>>;
