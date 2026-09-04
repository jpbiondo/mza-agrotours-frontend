import { useState } from "react";
import type { ActividadFormData } from "@/types/actividad-form";

export type EstadoGuardado = "publicado" | "borrador";

export function useGuardarActividad() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function guardar(data: ActividadFormData, estado: EstadoGuardado): Promise<void> {
    setIsLoading(true);
    setError(null);
    try {
      await mockGuardar(data, estado);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error inesperado");
      throw e;
    } finally {
      setIsLoading(false);
    }
  }

  return { guardar, isLoading, error };
}

// MOCK — reemplazar por fetch("/api/actividades", { method: "POST"/"PUT", body })
async function mockGuardar(_data: ActividadFormData, _estado: EstadoGuardado): Promise<void> {
  await new Promise<void>((res) => setTimeout(res, 800));
}
