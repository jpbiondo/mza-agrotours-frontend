import { useEffect, useState } from "react";
import { DASHBOARD } from "@/data/panel";
import type { DashboardData } from "@/types/panel";

interface UsePanelDashboardReturn {
  data: DashboardData | null;
  isLoading: boolean;
  error: string | null;
}

interface State {
  fincaId: string;
  data: DashboardData | null;
  error: string | null;
}

/**
 * Carga el dashboard del productor para la finca activa.
 * Reemplazar el cuerpo de mockFetchDashboard por un fetch real al backend.
 */
export function usePanelDashboard(fincaId: string): UsePanelDashboardReturn {
  // El estado guarda a qué finca pertenece el resultado: si no coincide con la
  // finca pedida, estamos cargando (loading derivado, sin setState en el efecto).
  const [state, setState] = useState<State>({ fincaId: "", data: null, error: null });

  useEffect(() => {
    let active = true;
    mockFetchDashboard(fincaId)
      .then((d) => { if (active) setState({ fincaId, data: d, error: null }); })
      .catch((e: unknown) => { if (active) setState({ fincaId, data: null, error: e instanceof Error ? e.message : "Error inesperado" }); });
    return () => { active = false; };
  }, [fincaId]);

  const isLoading = state.fincaId !== fincaId;
  return {
    data: isLoading ? null : state.data,
    error: isLoading ? null : state.error,
    isLoading,
  };
}

// MOCK — reemplazar por fetch(`/api/productor/${fincaId}/dashboard`) cuando exista el backend
async function mockFetchDashboard(_fincaId: string): Promise<DashboardData> {
  await new Promise<void>((res) => setTimeout(res, 600));
  return DASHBOARD;
}
