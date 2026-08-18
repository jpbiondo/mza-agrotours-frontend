import { useAsync } from "@/hooks/useAsync";
import { buildCalendario } from "@/data/calendario";
import type { CalendarioActividad } from "@/types/calendario";

/** Carga el calendario de disponibilidad de una actividad. Reemplazar el mock por fetch. */
export function useCalendarioActividad(actId: string) {
  return useAsync<CalendarioActividad>(() => mockFetch(actId), [actId]);
}

// MOCK — reemplazar por fetch(`/api/actividades/${actId}/calendario`)
async function mockFetch(actId: string): Promise<CalendarioActividad> {
  await new Promise<void>((res) => setTimeout(res, 600));
  const cal = buildCalendario(actId);
  if (!cal) throw new Error("Actividad no encontrada");
  return cal;
}
