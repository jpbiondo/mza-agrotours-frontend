import { useState } from "react";
import { useAsync } from "@/hooks/useAsync";
import { ESTADISTICAS } from "@/data/estadisticas";
import type { Estadisticas } from "@/types/estadisticas";

/** Carga las estadísticas del establecimiento activo. Reemplazar el mock por fetch. */
export function useEstadisticas(fincaId: string) {
  return useAsync<Estadisticas>(() => mockFetch(fincaId), [fincaId]);
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
