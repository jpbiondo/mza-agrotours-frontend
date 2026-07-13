import { useState } from "react";
import { apiFetch } from "@/lib/api";
import type { FormData } from "@/types/registro";

interface UseRegistroReturn {
  register: (data: FormData) => Promise<void>;
  isLoading: boolean;
  apiError: string | null;
}

/** El backend crea la cuenta completa (Firebase Admin SDK) en este endpoint. */
const CREATE_PATH = "/usuario/create";

interface CreateResponse {
  ok: boolean;
  code?: string;
}

/** Mapea el code del backend a copy en español (el frontend es dueño del texto). */
const MENSAJE_POR_CODE: Record<string, string> = {
  userAlreadyExists: "Este correo ya está registrado.",
};

function mensajeDe(code?: string): string {
  return (
    (code && MENSAJE_POR_CODE[code]) ||
    "No pudimos crear la cuenta. Revisá los datos e intentá de nuevo."
  );
}

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
    // `pais` es el iso2 del país seleccionado (no el nombre).
    pais: d.pais,
    fechaNacimiento: d.fecha ? d.fecha.toISOString() : null,
  };
}

export function useRegistro(): UseRegistroReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  async function register(data: FormData): Promise<void> {
    setIsLoading(true);
    setApiError(null);
    try {
      let res: CreateResponse;
      try {
        res = await apiFetch<CreateResponse>(CREATE_PATH, {
          method: "POST",
          body: JSON.stringify(toPayload(data)),
        });
      } catch {
        // Fallo técnico (red / backend caído): mensaje genérico, no de dominio.
        const msg =
          "Ocurrió un problema al crear la cuenta. Intentá de nuevo en unos minutos.";
        setApiError(msg);
        throw new Error(msg);
      }

      if (!res.ok) {
        const msg = mensajeDe(res.code);
        setApiError(msg);
        throw new Error(msg);
      }
    } finally {
      setIsLoading(false);
    }
  }

  return { register, isLoading, apiError };
}
