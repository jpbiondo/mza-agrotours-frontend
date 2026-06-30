import { useEffect, useState } from "react";
import { IMPAGOS } from "@/data/impagas";
import type { Reembolso, ReembolsoForm } from "@/types/impagas";

interface ListReturn {
  data: Reembolso[] | null;
  isLoading: boolean;
  error: string | null;
}

/** Lista los reembolsos (reservas impagas). Reemplazar el mock por fetch. */
export function useImpagas(): ListReturn {
  const [state, setState] = useState<{ data: Reembolso[] | null; error: string | null; loaded: boolean }>({
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

// MOCK — reemplazar por fetch("/api/admin/impagas")
async function mockFetch(): Promise<Reembolso[]> {
  await new Promise<void>((res) => setTimeout(res, 500));
  return IMPAGOS.map((r) => ({ ...r }));
}

/** Carga una transferencia de reembolso manual (US-RESE-10). */
export function useReembolsar() {
  const [isLoading, setIsLoading] = useState(false);
  async function reembolsar(_id: string, _form: ReembolsoForm): Promise<void> {
    setIsLoading(true);
    try { await new Promise<void>((res) => setTimeout(res, 700)); } finally { setIsLoading(false); }
  }
  return { reembolsar, isLoading };
}
