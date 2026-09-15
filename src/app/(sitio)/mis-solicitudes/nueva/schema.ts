import { z } from "zod";
import {
  EMAIL_RE,
  NOMBRE_ESTABLECIMIENTO_RE,
  TELEFONO_MSG,
  TELEFONO_RE,
} from "@/data/auth";

/**
 * Solicitud de alta de establecimiento (US-EST-03). Sólo los campos de texto;
 * los archivos de prueba se validan aparte (no encajan bien en el resolver).
 */
export const solicitarAltaSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(1, "El nombre del establecimiento es obligatorio.")
    .max(100, "Hasta 100 caracteres.")
    .regex(
      NOMBRE_ESTABLECIMIENTO_RE,
      "Solo se permiten letras, números, espacios, guiones y guiones bajos.",
    ),
  razonSocial: z
    .string()
    .trim()
    .min(1, "La razón social es obligatoria.")
    .max(100, "Hasta 100 caracteres."),
  cuit: z
    .string()
    .trim()
    .min(1, "El CUIT es obligatorio.")
    .max(11, "Hasta 11 caracteres."),
  descripcion: z
    .string()
    .trim()
    .min(1, "La descripción es obligatoria.")
    .max(2000, "Hasta 2000 caracteres."),
  departamento: z.string().min(1, "Seleccioná un departamento."),
  domicilio: z
    .string()
    .trim()
    .min(1, "El domicilio legal es obligatorio.")
    .max(200, "Hasta 200 caracteres."),
  email: z
    .string()
    .trim()
    .min(1, "El correo electrónico es obligatorio.")
    .max(100, "Hasta 100 caracteres.")
    .regex(EMAIL_RE, "Ingresá un correo electrónico válido."),
  telefono: z
    .string()
    .trim()
    .min(1, "El teléfono es obligatorio.")
    .regex(TELEFONO_RE, TELEFONO_MSG),
  cvu: z
    .string()
    .trim()
    .min(1, "El CVU es obligatorio.")
    .regex(/^\d{22}$/, "El CVU debe tener exactamente 22 dígitos numéricos."),
});

export type SolicitarAltaForm = z.infer<typeof solicitarAltaSchema>;

export const SOLICITAR_ALTA_INICIAL: SolicitarAltaForm = {
  nombre: "",
  razonSocial: "",
  cuit: "",
  descripcion: "",
  departamento: "",
  domicilio: "",
  email: "",
  telefono: "",
  cvu: "",
};
