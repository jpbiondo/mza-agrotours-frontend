import { z } from "zod";
import { EMAIL_RE } from "@/data/auth";

const SPECIAL_RE = /[!@#$%^&*(),.?":{}|<>_\-[\]\\/;'`~+=]/;

export const recoverEmailSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Este campo es obligatorio")
    .regex(EMAIL_RE, "Ingresá un email válido (nombre@dominio.com)"),
});

export const newPasswordSchema = z
  .object({
    pw: z
      .string()
      .min(1, "Este campo es obligatorio")
      .refine(
        (pw) => pw.length >= 8 && SPECIAL_RE.test(pw),
        "La contraseña debe tener mínimo 8 caracteres y un carácter especial",
      ),
    confirm: z.string().min(1, "Este campo es obligatorio"),
  })
  .refine(({ pw, confirm }) => pw === confirm, {
    message: "Las nuevas contraseñas no coinciden",
    path: ["confirm"],
  });
