import { apiFetch, comoEnvelope } from "@/lib/api";
import { conToken } from "@/lib/sesion";
import type { ArchivoUploadResponse } from "@/types/establecimiento";

/**
 * URLs prefirmadas para subir archivos al bucket.
 *
 * Cada contexto tiene su endpoint —y su permiso— pero el contrato es el mismo,
 * así que el path lo pone quien llama:
 *
 * - actividades → `/establecimientos/{id}/actividades/archivos/presign`
 *   (permiso GESTIONAR_ACTIVIDAD)
 * - portada del establecimiento → `/establecimientos/{id}/archivos/presign`
 *   (sólo el titular)
 *
 * La carpeta la decide el backend según el endpoint, no el cliente: es lo que
 * fija el prefijo de la key, las extensiones válidas y el peso máximo.
 */

/** Item de `archivos` en el request (DTO PresignedUrlRequest). */
export interface PresignItem {
  filename: string;
  fileSize: number;
}

function aRespuestas(v: unknown): ArchivoUploadResponse[] {
  if (!Array.isArray(v)) return [];
  return v.filter(
    (r): r is ArchivoUploadResponse =>
      !!r && typeof r === "object" && typeof (r as ArchivoUploadResponse).uploadUrl === "string",
  );
}

/**
 * Pide las firmas de una tanda. Es una escritura disparada por el usuario, así
 * que va con `conToken`.
 *
 * Devuelve `null` si el pedido falló entero —ahí ningún archivo de la tanda
 * puede subir—. Un ApiError con code es de dominio (extensión no permitida,
 * peso), uno sin code es técnico, pero para el uploader dan lo mismo: la tanda
 * no se puede subir y el tile queda en error con su reintento.
 */
export async function pedirFirmas(
  path: string,
  items: PresignItem[],
): Promise<ArchivoUploadResponse[] | null> {
  try {
    const res = await conToken((token) =>
      apiFetch<unknown>(path, { method: "POST", token, body: JSON.stringify({ archivos: items }) }),
    );
    const env = comoEnvelope<unknown>(res);
    return env.ok ? aRespuestas(env.data) : null;
  } catch {
    return null;
  }
}
