import { useState } from "react";
import { useAsync } from "@/hooks/useAsync";
import { FINCA_DATOS } from "@/data/datos";
import type { EstablecimientoDatos } from "@/types/datos";

/** Carga los datos del establecimiento activo. Reemplazar el mock por fetch. */
export function useEstablecimientoDatos(fincaId: string) {
  return useAsync<EstablecimientoDatos>(() => mockFetch(fincaId), [fincaId]);
}

// MOCK — reemplazar por fetch(`/api/productor/${fincaId}/establecimiento`)
async function mockFetch(_fincaId: string): Promise<EstablecimientoDatos> {
  await new Promise<void>((res) => setTimeout(res, 600));
  return FINCA_DATOS;
}

/** Guarda los cambios de una sección. */
export function useGuardarEstablecimiento() {
  const [isLoading, setIsLoading] = useState(false);

  async function guardar(patch: Partial<EstablecimientoDatos>): Promise<void> {
    setIsLoading(true);
    try { await mockGuardar(patch); } finally { setIsLoading(false); }
  }

  return { guardar, isLoading };
}

// MOCK — reemplazar por fetch(`/api/establecimiento`, { method: "PATCH", body: patch })
async function mockGuardar(_patch: Partial<EstablecimientoDatos>): Promise<void> {
  await new Promise<void>((res) => setTimeout(res, 650));
}

/** Da de baja el establecimiento (US-EST-06). */
export function useEliminarEstablecimiento() {
  const [isLoading, setIsLoading] = useState(false);

  async function eliminar(): Promise<void> {
    setIsLoading(true);
    try { await mockEliminar(); } finally { setIsLoading(false); }
  }

  return { eliminar, isLoading };
}

// MOCK — reemplazar por fetch(`/api/establecimiento`, { method: "DELETE" })
async function mockEliminar(): Promise<void> {
  await new Promise<void>((res) => setTimeout(res, 800));
}
