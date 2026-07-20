import { useState } from "react";
import { ApiError, apiFetch } from "@/lib/api";
import type { FormData } from "@/types/registro";

interface CreateResponse {
  ok: boolean;
  code?: string;
}

interface UseRegistroReturn {
  register: (data: FormData) => Promise<CreateResponse>;
  isLoading: boolean;
}

/** El backend crea la cuenta completa (Firebase Admin SDK) en este endpoint. */
const CREATE_PATH = "/usuario/create";

/**
 * Arma el payload que espera /usuario/create. Se envía la contraseña en texto plano
 * sobre HTTPS; Firebase (vía Admin SDK en el backend) la hashea — nunca se persiste acá.
 * NOTA: confirmar los nombres de `pais` / `fechaNacimiento` contra el DTO del backend.
 */
function toPayload(d: FormData) {
  return {
    nombre: d.nombre.trim(),
    email: d.email.trim().toLowerCase(),
    password: d.password,
    telefono: d.telefono.trim(),
    identificacion: d.numeroId.trim(),
    tipoIdentificacion: d.tipoId,
    // iso2 del país seleccionado (no el nombre).
    paisIso2: d.pais,
    fechaNacimiento: d.fecha ? d.fecha.toISOString() : null,
  };
}

/**
 * Alta de cuenta. Devuelve `{ ok, code }`: el llamador decide el texto y dónde
 * mostrarlo (toast / error de campo). Los errores de dominio llegan como 2xx
 * `{ ok:false, code }` o como 4xx (ApiError con `code`); un fallo técnico sin
 * code vuelve como `{ ok:false }` → mensaje genérico.
 */
export function useRegistro(): UseRegistroReturn {
  const [isLoading, setIsLoading] = useState(false);

  async function register(data: FormData): Promise<CreateResponse> {
    setIsLoading(true);
    try {
      const res = await apiFetch<CreateResponse>(CREATE_PATH, {
        method: "POST",
        body: JSON.stringify(toPayload(data)),
      });
      return res.ok ? { ok: true } : { ok: false, code: res.code };
    } catch (e) {
      if (e instanceof ApiError) return { ok: false, code: e.code };
      return { ok: false };
    } finally {
      setIsLoading(false);
    }
  }

  return { register, isLoading };
}
