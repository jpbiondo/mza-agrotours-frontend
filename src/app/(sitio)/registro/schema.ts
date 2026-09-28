import { z } from "zod";
import { EMAILS_REGISTRADOS } from "@/data/registro";
import { NOMBRE_RE, TELEFONO_MSG, TELEFONO_RE } from "@/data/auth";

const SPECIAL_RE = /[!@#$%^&*(),.?":{}|<>_\-[\]\\/;'`~+=]/;

/** Datos del perfil: lo que se manda a /usuario/create. */
const perfilSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(1, "Este campo es obligatorio")
    .min(3, "Debe tener entre 3 y 40 caracteres")
    .max(40, "Debe tener entre 3 y 40 caracteres")
    .regex(
      NOMBRE_RE,
      "El nombre solo puede contener letras, espacios, guiones y apóstrofos",
    ),
  pais: z.string().min(1, "Este campo es obligatorio"),
  fecha: z
    .date()
    .nullable()
    .refine((v) => v !== null, "Este campo es obligatorio"),
  tipoId: z.string().min(1, "Este campo es obligatorio"),
  numeroId: z
    .string()
    .trim()
    .min(1, "Este campo es obligatorio")
    .min(5, "Debe tener entre 5 y 20 caracteres")
    .max(20, "Debe tener entre 5 y 20 caracteres"),
  telefono: z
    .string()
    .trim()
    .min(1, "Este campo es obligatorio")
    .regex(TELEFONO_RE, TELEFONO_MSG),
  terminos: z
    .boolean()
    .refine(
      (v) => v === true,
      "Debe leer y aceptar los términos y condiciones para poder registrarse",
    ),
});

/** Alta completa: el perfil más la cuenta de Firebase (email y contraseña). */
export const registroSchema = perfilSchema
  .extend({
    email: z
      .email({ error: "Correo electrónico inválido" })
      .refine((v) => !EMAILS_REGISTRADOS.includes(v.toLocaleLowerCase()), {
        error: "Correo electrónico ya registrado",
      }),
    // Por UX: la regla que manda es la password policy de Firebase Auth.
    password: z
      .string()
      .min(1, "Este campo es obligatorio")
      .refine(
        (pw) => pw.length >= 8 && SPECIAL_RE.test(pw),
        "La contraseña debe tener mínimo 8 caracteres y un carácter especial",
      ),
    confirm: z.string().min(1, "Este campo es obligatorio"),
  })
  .refine(({ password, confirm }) => password === confirm, {
    message: "Las contraseñas ingresadas no coinciden",
    path: ["confirm"],
  });

/**
 * Completar un alta a medias: la cuenta de Firebase ya existe, así que email y
 * contraseña no se piden. Se mantienen en el esquema (sin validar) para que el
 * formulario comparta el tipo `FormData` con el alta.
 */
export const completarRegistroSchema = perfilSchema.extend({
  email: z.string(),
  password: z.string(),
  confirm: z.string(),
});
