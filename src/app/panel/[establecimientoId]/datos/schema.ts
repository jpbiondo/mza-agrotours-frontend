import { z } from "zod";
import { NOMBRE_ESTABLECIMIENTO_RE, TELEFONO_MSG, TELEFONO_RE } from "@/data/auth";

/*
 * Secciones editables de "Datos del establecimiento" (US-EST-05). Cada una se
 * guarda por separado, así que cada una tiene su schema.
 */

export const identidadSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(1, "El nombre del establecimiento no puede estar vacío.")
    .max(100, "El nombre no puede superar los 100 caracteres.")
    .regex(
      NOMBRE_ESTABLECIMIENTO_RE,
      "Solo se permiten letras, números, espacios, guiones y guiones bajos.",
    ),
  // Sin `.trim()`: viaja tal cual se escribió, y el largo es el que muestra el
  // contador del campo.
  descripcion: z
    .string()
    .refine((v) => v.trim() !== "", "La descripción no puede estar vacía.")
    .refine((v) => v.length <= 2000, "La descripción no puede superar los 2000 caracteres."),
});

export type IdentidadForm = z.infer<typeof identidadSchema>;

export const contactoSchema = z.object({
  telefono: z
    .string()
    .trim()
    .min(1, "El teléfono no puede estar vacío.")
    // El largo ya lo fija TELEFONO_RE.
    .regex(TELEFONO_RE, TELEFONO_MSG),
  email: z
    .string()
    .trim()
    .min(1, "El email no puede estar vacío.")
    .max(100, "El email no puede superar los 100 caracteres.")
    .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Ingresá un email válido."),
});

export type ContactoForm = z.infer<typeof contactoSchema>;
