import { useEffect, useState } from "react";
import { CULTIVOS } from "@/data/cultivos";
import type { Cultivo } from "@/types/cultivos";

interface UseCultivosReturn {
  data: Cultivo[] | null;
  isLoading: boolean;
  error: string | null;
}

/** Lista los cultivos del catálogo. Reemplazar el mock por un fetch real. */
export function useCultivos(): UseCultivosReturn {
  const [state, setState] = useState<{ data: Cultivo[] | null; error: string | null; loaded: boolean }>({
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

// MOCK — reemplazar por fetch("/api/cultivos")
async function mockFetch(): Promise<Cultivo[]> {
  await new Promise<void>((res) => setTimeout(res, 500));
  return CULTIVOS;
}
