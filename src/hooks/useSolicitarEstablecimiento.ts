import { useState } from "react";
import { auth } from "../../firebase.config";
import { apiFetch, ApiError } from "@/lib/api";
import type { SolicitarAltaForm } from "@/app/panel/establecimientos/solicitar/schema";

interface CreateResponse {
  ok: boolean;
  code?: string;
}

/** Payload de POST /solicitudes-establecimiento/create (DTO SolicitudEstablecimientoCreateReq). */
function toPayload(f: SolicitarAltaForm) {
  return {
    nombreEstablecimiento: f.nombre.trim(),
    razonSocial: f.razonSocial.trim(),
    cuit: f.cuit.trim(),
    domicilioLegal: f.domicilio.trim(),
    departamento: f.departamento,
    telefono: f.telefono.trim(),
    email: f.email.trim().toLowerCase(),
    cvu: f.cvu.trim(),
  };
}

/**
 * Crea una solicitud de alta de establecimiento (POST /solicitudes-establecimiento/create
 * con el ID token de Firebase). Devuelve `{ ok, code }`: errores de dominio como 2xx
 * `{ ok:false, code }` o 4xx (ApiError con code); un fallo técnico sin code → `{ ok:false }`.
 */
export function useSolicitarEstablecimiento() {
  const [isLoading, setIsLoading] = useState(false);

  async function solicitar(data: SolicitarAltaForm): Promise<CreateResponse> {
    setIsLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) return { ok: false };
      const token = await user.getIdToken();
      try {
        const res = await apiFetch<CreateResponse>("/solicitudes-establecimiento/create", {
          method: "POST",
          token,
          body: JSON.stringify(toPayload(data)),
        });
        return res.ok ? { ok: true } : { ok: false, code: res.code };
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
