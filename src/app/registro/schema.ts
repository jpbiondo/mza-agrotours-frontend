import { z } from "zod";
import { EMAILS_REGISTRADOS } from "@/data/registro";

const SPECIAL_RE = /[!@#$%^&*(),.?":{}|<>_\-[\]\\/;'`~+=]/;

export const registroSchema = z
  .object({
    nombre: z
      .string()
      .trim()
      .min(1, "Este campo es obligatorio")
      .max(40, "Máximo 40 caracteres"),
    email: z
      .email({ error: "Correo electrónico inválido" })
      .refine((v) => !EMAILS_REGISTRADOS.includes(v.toLocaleLowerCase()), {
        error: "Correo electrónico ya registrado",
      }),
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
      .min(7, "El teléfono debe tener entre 7 y 15 caracteres")
      .max(15, "El teléfono debe tener entre 7 y 15 caracteres"),
    password: z
      .string()
      .min(1, "Este campo es obligatorio")
      .refine(
        (pw) => pw.length >= 8 && SPECIAL_RE.test(pw),
        "La contraseña debe tener mínimo 8 caracteres y un carácter especial",
      ),
    confirm: z.string().min(1, "Este campo es obligatorio"),
    terminos: z
      .boolean()
      .refine(
        (v) => v === true,
        "Debe leer y aceptar los términos y condiciones para poder registrarse",
      ),
  })
  .refine(({ password, confirm }) => password === confirm, {
    message: "Las contraseñas ingresadas no coinciden",
    path: ["confirm"],
  });
