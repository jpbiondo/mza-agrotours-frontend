import { Home, Building2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { LimitesUploader } from "@/components/ui/uploader";

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
export const UPLOAD_ACCEPT_LABEL = "PDF, JPG o PNG";
export const UPLOAD_MAX_BYTES = 30 * 1024 * 1024; // 30 MB

/** Únicos formatos aceptados como prueba documental. */
export const UPLOAD_EXTENSIONES = ["pdf", "png", "jpg", "jpeg"] as const;
export const UPLOAD_MIMES = ["application/pdf", "image/png", "image/jpeg"] as const;
/** Valor del atributo `accept` del input file. */
export const UPLOAD_ACCEPT = UPLOAD_EXTENSIONES.map((e) => "." + e).join(",");

/**
 * MIME por extensión aceptada. `jpg` y `jpeg` comparten `image/jpeg`.
 * Tipado contra UPLOAD_EXTENSIONES: si se agrega una extensión al tuple,
 * TypeScript exige completarla acá.
 */
export const UPLOAD_MIME_POR_EXT: Record<
  (typeof UPLOAD_EXTENSIONES)[number],
  (typeof UPLOAD_MIMES)[number]
> = { pdf: "application/pdf", png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg" };

export const UPLOAD_PRUEBAS: LimitesUploader = {
  maxFiles: UPLOAD_MAX_FILES,
  maxBytesTotal: UPLOAD_MAX_BYTES,
  accept: UPLOAD_ACCEPT,
  acceptLabel: UPLOAD_ACCEPT_LABEL,
  extensiones: UPLOAD_EXTENSIONES,
  mimes: UPLOAD_MIMES,
};

/** Extensión en minúsculas y sin punto. "" si el nombre no tiene extensión. */
export function extensionDe(nombre: string): string {
  const partes = nombre.split(".");
  return partes.length > 1 ? (partes.pop() as string).toLowerCase() : "";
}

/** Acepta sólo PDF, PNG y JPG. Valida por extensión y, si el navegador lo informa, por MIME. */
export function esArchivoPermitido(file: File): boolean {
  const ext = extensionDe(file.name);
  if (!UPLOAD_EXTENSIONES.includes(ext as (typeof UPLOAD_EXTENSIONES)[number])) return false;
  const mime = file.type.toLowerCase();
  return mime === "" || UPLOAD_MIMES.includes(mime as (typeof UPLOAD_MIMES)[number]);
}

/**
 * Content-Type a declarar al backend y a repetir en el PUT prefirmado. El
 * navegador puede informar `file.type` vacío (drag & drop, SO sin el MIME
 * registrado), así que se deriva de la extensión.
 *
 * Debe llamarse SIEMPRE sobre el mismo File en ambos pasos: el backend firma
 * la URL con este valor y el object storage lo verifica.
 */
export function contentTypeDe(file: File): string {
  const informado = file.type.trim().toLowerCase();
  if (informado) return informado;
  const ext = extensionDe(file.name);
  return (UPLOAD_MIME_POR_EXT as Record<string, string>)[ext] ?? "application/octet-stream";
}
