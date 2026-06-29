import { useEffect, useState } from "react";
import { ESTADISTICAS } from "@/data/estadisticas";
import type { Estadisticas } from "@/types/estadisticas";

interface UseEstadisticasReturn {
  data: Estadisticas | null;
  isLoading: boolean;
  error: string | null;
}

/** Carga las estadísticas del establecimiento activo. Reemplazar el mock por fetch. */
export function useEstadisticas(fincaId: string): UseEstadisticasReturn {
  const [state, setState] = useState<{ fincaId: string; data: Estadisticas | null; error: string | null }>({
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

// MOCK — reemplazar por fetch(`/api/productor/${fincaId}/estadisticas`)
async function mockFetch(_fincaId: string): Promise<Estadisticas> {
  await new Promise<void>((res) => setTimeout(res, 600));
  return ESTADISTICAS;
}

export interface ExportOpts {
  format: "pdf" | "csv" | "xlsx";
  scope: "performance" | "completo";
}

/** Genera y descarga un reporte (simulado). */
export function useExportarReporte() {
  const [isLoading, setIsLoading] = useState(false);

  async function exportar(opts: ExportOpts): Promise<void> {
    setIsLoading(true);
    try { await mockExportar(opts); } finally { setIsLoading(false); }
  }

  return { exportar, isLoading };
}

// MOCK — reemplazar por la generación real del reporte en el backend
async function mockExportar(_opts: ExportOpts): Promise<void> {
  await new Promise<void>((res) => setTimeout(res, 900));
}
