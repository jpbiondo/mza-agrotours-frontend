import { useState } from "react";
import { auth } from "../../firebase.config";
import { apiFetch, ApiError } from "@/lib/api";
import { contentTypeDe } from "@/data/establecimiento";
import type { SolicitarAltaForm } from "@/app/(sitio)/mis-solicitudes/nueva/schema";
import type {
  ArchivoUploadRequest,
  SolicitudEstablecimientoCreateResp,
} from "@/types/establecimiento";

interface CreateResponse {
  ok: boolean;
  code?: string;
  data?: SolicitudEstablecimientoCreateResp;
}

/**
 * Metadatos de cada archivo seleccionado (DTO ArchivoUploadRequest). El backend
 * firma una URL de subida por item; el archivo en sí no viaja acá.
 */
function toArchivos(files: File[]): ArchivoUploadRequest[] {
  return files.map((f) => ({
    filename: f.name,
    // Misma función que usa el PUT prefirmado sobre el mismo File: así el
    // content type firmado y el enviado no se pueden desincronizar.
    contentType: contentTypeDe(f),
    fileSize: f.size,
  }));
}

/** Payload de POST /solicitudes-establecimiento/create (DTO SolicitudEstablecimientoCreateReq). */
function toPayload(f: SolicitarAltaForm, files: File[]) {
  return {
    nombreEstablecimiento: f.nombre.trim(),
    razonSocial: f.razonSocial.trim(),
    cuit: f.cuit.trim(),
    descripcion: f.descripcion.trim(),
    domicilioLegal: f.domicilio.trim(),
    departamento: f.departamento,
    telefono: f.telefono.trim(),
    email: f.email.trim().toLowerCase(),
    cvu: f.cvu.trim(),
    archivos: toArchivos(files),
  };
}

/**
 * Crea una solicitud de alta de establecimiento (POST /solicitudes-establecimiento/create
 * con el ID token de Firebase). Devuelve `{ ok, code }`: errores de dominio como 2xx
 * `{ ok:false, code }` o 4xx (ApiError con code); un fallo técnico sin code → `{ ok:false }`.
 *
 * En el camino feliz `data` trae las URLs prefirmadas para subir los archivos
 * (ver `useSubirArchivos`), pero la solicitud queda creada aunque falte.
 */
export function useSolicitarEstablecimiento() {
  const [isLoading, setIsLoading] = useState(false);

  async function solicitar(data: SolicitarAltaForm, files: File[]): Promise<CreateResponse> {
    setIsLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) return { ok: false };
      const token = await user.getIdToken();
      try {
        const res = await apiFetch<CreateResponse>("/solicitudes-establecimiento/create", {
          method: "POST",
          token,
          body: JSON.stringify(toPayload(data, files)),
        });
        return res.ok ? { ok: true, data: res.data } : { ok: false, code: res.code };
      } catch (e) {
        if (e instanceof ApiError) return { ok: false, code: e.code };
        return { ok: false };
      }
    } finally {
      setIsLoading(false);
    }
  }

  return { solicitar, isLoading };
}
