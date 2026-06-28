import { useEffect, useState } from "react";
import { buildCalendario } from "@/data/calendario";
import type { CalendarioActividad } from "@/types/calendario";

interface UseCalendarioReturn {
  data: CalendarioActividad | null;
  isLoading: boolean;
  error: string | null;
}

/** Carga el calendario de disponibilidad de una actividad. Reemplazar el mock por fetch. */
export function useCalendarioActividad(actId: string): UseCalendarioReturn {
  const [state, setState] = useState<{ actId: string; data: CalendarioActividad | null; error: string | null }>({
    actId: "", data: null, error: null,
  });

  useEffect(() => {
    let active = true;
    mockFetch(actId)
      .then((d) => { if (active) setState({ actId, data: d, error: null }); })
      .catch((e: unknown) => { if (active) setState({ actId, data: null, error: e instanceof Error ? e.message : "Error inesperado" }); });
    return () => { active = false; };
  }, [actId]);

  const isLoading = state.actId !== actId;
  return { data: isLoading ? null : state.data, error: isLoading ? null : state.error, isLoading };
}

// MOCK — reemplazar por fetch(`/api/actividades/${actId}/calendario`)
async function mockFetch(actId: string): Promise<CalendarioActividad> {
  await new Promise<void>((res) => setTimeout(res, 600));
  const cal = buildCalendario(actId);
  if (!cal) throw new Error("Actividad no encontrada");
  return cal;
}
