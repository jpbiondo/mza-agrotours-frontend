import { useEffect, useState } from "react";
import { FINCA_DATOS } from "@/data/datos";
import type { EstablecimientoDatos } from "@/types/datos";

interface UseEstablecimientoDatosReturn {
  data: EstablecimientoDatos | null;
  isLoading: boolean;
  error: string | null;
}

/** Carga los datos del establecimiento activo. Reemplazar el mock por fetch. */
export function useEstablecimientoDatos(fincaId: string): UseEstablecimientoDatosReturn {
  const [state, setState] = useState<{ fincaId: string; data: EstablecimientoDatos | null; error: string | null }>({
    fincaId: "", data: null, error: null,
  });

  useEffect(() => {
    let active = true;
    mockFetch(fincaId)
      .then((d) => { if (active) setState({ fincaId, data: d, error: null }); })
      .catch((e: unknown) => { if (active) setState({ fincaId, data: null, error: e instanceof Error ? e.message : "Error inesperado" }); });
    return () => { active = false; };
  }, [fincaId]);

  const isLoading = state.fincaId !== fincaId;
  return { data: isLoading ? null : state.data, error: isLoading ? null : state.error, isLoading };
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
