import { useEffect, useState } from "react";
import { GI_SEED } from "@/data/incidencias";
import type { EstadoIncidencia, Incidencia } from "@/types/incidencias";

interface ListReturn {
  data: Incidencia[] | null;
  isLoading: boolean;
  error: string | null;
}

/** Lista las incidencias reportadas. Reemplazar el mock por fetch. */
export function useIncidencias(): ListReturn {
  const [state, setState] = useState<{ data: Incidencia[] | null; error: string | null; loaded: boolean }>({
    data: null, error: null, loaded: false,
  });

  useEffect(() => {
    let active = true;
    mockFetch()
      .then((d) => { if (active) setState({ data: d, error: null, loaded: true }); })
      .catch((e: unknown) => { if (active) setState({ data: null, error: e instanceof Error ? e.message : "Error inesperado", loaded: true }); });
    return () => { active = false; };
  }, []);

  return { data: state.data, error: state.error, isLoading: !state.loaded };
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
