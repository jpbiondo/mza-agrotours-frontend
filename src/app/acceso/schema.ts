import { z } from "zod";
import { EMAIL_RE } from "@/data/auth";

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Este campo es obligatorio")
    .regex(EMAIL_RE, "Ingresá un email válido (nombre@dominio.com)"),
  password: z.string().min(1, "Este campo es obligatorio"),
});

export type LoginData = z.infer<typeof loginSchema>;