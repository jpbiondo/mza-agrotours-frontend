import { useState } from "react";
import type { FormData } from "@/types/registro";

interface UseRegistroReturn {
  register: (data: FormData) => Promise<void>;
  isLoading: boolean;
  apiError: string | null;
}

export function useRegistro(): UseRegistroReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  async function register(data: FormData): Promise<void> {
    setIsLoading(true);
    setApiError(null);
    try {
      await mockRegister(data);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error inesperado";
      setApiError(msg);
      throw e;
    } finally {
      setIsLoading(false);
    }
  }

  return { register, isLoading, apiError };
}

// MOCK — reemplazar el cuerpo con fetch real cuando el backend esté listo
async function mockRegister(_data: FormData): Promise<void> {
  await new Promise<void>((res) => setTimeout(res, 850));

  // Para testear manejo de errores, descomentar:
  // throw new Error("El email ya está registrado");
}
