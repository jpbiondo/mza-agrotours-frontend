import { useEffect, useState } from "react";
import { DEUDAS_SEED } from "@/data/deudas";
import type { Deuda } from "@/types/deudas";

interface ListReturn {
  data: Deuda[] | null;
  isLoading: boolean;
  error: string | null;
}

/** Lista las deudas de productores. Reemplazar el mock por fetch. */
export function useDeudas(): ListReturn {
  const [state, setState] = useState<{ data: Deuda[] | null; error: string | null; loaded: boolean }>({
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

// MOCK — reemplazar por fetch("/api/admin/deudas")
async function mockFetch(): Promise<Deuda[]> {
  await new Promise<void>((res) => setTimeout(res, 500));
  return DEUDAS_SEED.map((d) => ({ ...d }));
}
