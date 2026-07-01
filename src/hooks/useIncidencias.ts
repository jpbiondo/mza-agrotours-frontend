import { useState } from "react";
import { useAsync } from "@/hooks/useAsync";
import { GI_SEED } from "@/data/incidencias";
import type { EstadoIncidencia, Incidencia } from "@/types/incidencias";

/** Lista las incidencias reportadas. Reemplazar el mock por fetch. */
export function useIncidencias() {
  return useAsync<Incidencia[]>(mockFetch);
}

// MOCK — reemplazar por fetch("/api/admin/incidencias")
async function mockFetch(): Promise<Incidencia[]> {
  await new Promise<void>((res) => setTimeout(res, 500));
  return GI_SEED.map((i) => ({ ...i }));
}

/** Actualiza el estado de una incidencia (cierra con motivo si es terminal). */
export function useGuardarIncidencia() {
  const [isLoading, setIsLoading] = useState(false);
  async function guardar(_id: string, _estado: EstadoIncidencia, _motivo: string | null): Promise<void> {
    setIsLoading(true);
    try { await new Promise<void>((res) => setTimeout(res, 600)); } finally { setIsLoading(false); }
  }
  return { guardar, isLoading };
}
