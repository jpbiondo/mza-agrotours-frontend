import { useAsync } from "@/hooks/useAsync";
import { DASHBOARD } from "@/data/panel";
import type { DashboardData } from "@/types/panel";

/**
 * Carga el dashboard del productor para la finca activa.
 * Reemplazar el cuerpo de mockFetchDashboard por un fetch real al backend.
 */
export function usePanelDashboard(fincaId: string) {
  return useAsync<DashboardData>(() => mockFetchDashboard(fincaId), [fincaId]);
}

// MOCK — reemplazar por fetch(`/api/productor/${fincaId}/dashboard`) cuando exista el backend
async function mockFetchDashboard(_fincaId: string): Promise<DashboardData> {
  await new Promise<void>((res) => setTimeout(res, 600));
  return DASHBOARD;
}
