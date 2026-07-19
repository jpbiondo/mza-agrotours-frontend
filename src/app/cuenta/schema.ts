import { z } from "zod";
import { EMAIL_RE } from "@/data/auth";

const SPECIAL_RE = /[!@#$%^&*(),.?":{}|<>_\-[\]\\/;'`~+=]/;

/**
 * Datos personales de la cuenta. Réplica en zod de `validarPerfil` (data/cuenta),
 * conservando mensajes y orden de chequeo.
 */
export const perfilSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(1, "Este campo es obligatorio")
    .max(40, "Máximo 40 caracteres"),
  fechaNac: z
    .date()
    .nullable()
    .superRefine((v, ctx) => {
      if (!v) {
        ctx.addIssue({ code: "custom", message: "Este campo es obligatorio" });
        return;
      }
      const hoy = new Date();
      const min = new Date(hoy.getFullYear() - 120, hoy.getMonth(), hoy.getDate());
      if (v > hoy) {
        ctx.addIssue({ code: "custom", message: "La fecha debe ser del pasado" });
      } else if (v < min) {
        ctx.addIssue({
          code: "custom",
          message: "No puede ser anterior a hace 120 años",
        });
      }
    }),
  tipoIdent: z.string().min(1, "Seleccioná un tipo de identificación"),
  identificacion: z
    .string()
    .trim()
    .min(1, "Este campo es obligatorio")
    .max(20, "Máximo 20 caracteres"),
  email: z
    .string()
    .trim()
    .min(1, "Este campo es obligatorio")
    .max(100, "Máximo 100 caracteres")
    .regex(EMAIL_RE, "Ingresá un email válido (nombre@dominio.com)"),
  telefono: z
    .string()
    .trim()
    .min(1, "Este campo es obligatorio")
    .regex(/^\d{7,16}$/, "Ingresá entre 7 y 16 dígitos"),
  paisIso2: z.string(),
});

/**
 * Cambio de contraseña. `actual` sólo se valida como obligatorio acá; que sea la
 * contraseña correcta lo verifica el backend/Firebase (code "badActual").
 */
export const cambiarPasswordSchema = z
  .object({
    actual: z.string().min(1, "Este campo es obligatorio"),
    nueva: z
      .string()
      .min(1, "Este campo es obligatorio")
      .refine(
        (pw) => pw.length >= 8 && SPECIAL_RE.test(pw),
        "La contraseña no cumple los requisitos.",
      ),
    confirm: z.string().min(1, "Este campo es obligatorio"),
  })
  .refine(({ nueva, confirm }) => nueva === confirm, {
    message: "Las contraseñas no coinciden.",
    path: ["confirm"],
  });

export type CambiarPasswordForm = z.infer<typeof cambiarPasswordSchema>;
