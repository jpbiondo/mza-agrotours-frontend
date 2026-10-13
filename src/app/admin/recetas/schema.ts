import { z } from "zod";

/**
 * Caracteres que acepta el nombre del lado del backend (`@SinCaracteresEspeciales`):
 * letras con acentos, números, espacios, guion medio y guion bajo.
 */
const NOMBRE_VALIDO = /^[a-zA-Z0-9áéíóúüÁÉÍÓÚÜñÑ _-]*$/;

/** Comparable entre nombres: sin mayúsculas ni espacios de más. */
const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");

/** Entero mayor a 0 escrito como texto: un input vacío no es un 0. */
const enteroPositivo = (mensaje: string) =>
  z.string().refine((v) => /^\d+$/.test(v) && Number(v) >= 1, mensaje);

/** Lista que tiene que traer al menos un renglón con algo escrito. */
const listaNoVacia = (mensaje: string) =>
  z.array(z.string()).refine((xs) => xs.some((x) => x.trim()), mensaje);

/**
 * Alta y edición de una receta. Es una función porque el nombre no puede
 * repetir el de otra receta del catálogo (sin contar la que se edita).
 *
 * La imagen no está acá: se sube apenas se elige y tiene estado propio
 * (subiendo / error), que maneja `useImagenUnica`.
 */
export function recetaSchema(nombresOcupados: string[]) {
  const ocupados = new Set(nombresOcupados.map(norm));

  return z.object({
    nombre: z
      .string()
      .trim()
      .min(1, "Ingresá el nombre de la receta.")
      .max(100, "El nombre no puede superar los 100 caracteres.")
      .regex(NOMBRE_VALIDO, "Usá solo letras, números, espacios, guiones y guiones bajos.")
      .refine((v) => !ocupados.has(norm(v)), "Ya existe una receta con ese nombre. Elegí otro."),
    cultivosIds: z.array(z.string()).min(1, "Asociá al menos un cultivo."),
    dificultad: z.enum(["FACIL", "MEDIA", "DIFICIL"]),
    porciones: enteroPositivo("Ingresá una cantidad mayor a 0."),
    tiempo: enteroPositivo("Ingresá el tiempo en minutos (mayor a 0)."),
    descripcion: z.string().trim().min(1, "Escribí una breve descripción."),
    // El backend pide al menos un ingrediente y un paso (`@NotEmpty`).
    ingredientes: listaNoVacia("Cargá al menos un ingrediente."),
    pasos: listaNoVacia("Cargá al menos un paso."),
  });
}

export type RecetaForm = z.infer<ReturnType<typeof recetaSchema>>;
