import { Home, Building2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";

/** Los 18 departamentos de la provincia de Mendoza. */
export const DEPARTAMENTOS_MZA = [
  "Capital", "General Alvear", "Godoy Cruz", "Guaymallén", "Junín", "La Paz",
  "Las Heras", "Lavalle", "Luján de Cuyo", "Maipú", "Malargüe", "Rivadavia",
  "San Carlos", "San Martín", "San Rafael", "Santa Rosa", "Tunuyán", "Tupungato",
] as const;

/** Requisitos documentales que se muestran junto al uploader de pruebas. */
export interface RequisitoDoc {
  id: string;
  icon: LucideIcon;
  titulo: string;
  items: string[];
}

export const REQUISITOS_DOC: RequisitoDoc[] = [
  {
    id: "familiar",
    icon: Home,
    titulo: "Productor familiar",
    items: [
      "Documento Nacional de Identidad (DNI frente y dorso) del titular.",
      "Boleta de servicio (luz, agua o gas) a nombre del titular o certificado de domicilio, para validar que la dirección física de la experiencia coincide con su residencia.",
    ],
  },
  {
    id: "comercial",
    icon: Building2,
    titulo: "Establecimiento agrícola comercial",
    items: [
      "Constancia de CUIT/CUIL (ARCA).",
      "Certificado del Registro de Uso de la Tierra (RUT) emitido por la provincia de Mendoza.",
      "Habilitación Comercial Municipal o Constancia de Inscripción en el INV (para establecimientos vitivinícolas).",
    ],
  },
];

/** Límites del uploader de pruebas. */
export const UPLOAD_MAX_FILES = 10;
export const UPLOAD_MAX_BYTES = 30 * 1024 * 1024; // 30 MB
