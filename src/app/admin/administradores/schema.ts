import { z } from "zod";
import { EMAIL_RE } from "@/data/auth";

/**
 * Alta de administrador del sistema. La existencia de la cuenta y si ya es
 * administradora se resuelven contra el backend (ver `useUsuarioCard`), así que
 * acá sólo se valida lo que se puede saber sin red.
 */
export const nuevoAdminSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Ingresá el correo electrónico de la persona.")
    .regex(EMAIL_RE, "Escribí un correo electrónico válido."),
  rolId: z.string().min(1, "Elegí un rol para asignar al administrador."),
});

export type NuevoAdminForm = z.infer<typeof nuevoAdminSchema>;

export const NUEVO_ADMIN_INICIAL: NuevoAdminForm = { email: "", rolId: "" };
