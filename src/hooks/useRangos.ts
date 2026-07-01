import { useEffect, useState } from "react";
import { RANGO_SEED } from "@/data/rangos";
import type { RangoEtario } from "@/types/rangos";

interface ListReturn {
  data: RangoEtario[] | null;
  isLoading: boolean;
  error: string | null;
}

/** Lista los rangos etarios del sistema. Reemplazar el mock por fetch. */
export function useRangos(): ListReturn {
  const [state, setState] = useState<{ data: RangoEtario[] | null; error: string | null; loaded: boolean }>({
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

// MOCK — reemplazar por fetch("/api/admin/rangos-etarios")
async function mockFetch(): Promise<RangoEtario[]> {
  await new Promise<void>((res) => setTimeout(res, 500));
  return RANGO_SEED.map((r) => ({ ...r }));
}

export function useGuardarRango() {
  const [isLoading, setIsLoading] = useState(false);
  async function guardar(_rango: RangoEtario): Promise<void> {
    setIsLoading(true);
    try { await new Promise<void>((res) => setTimeout(res, 600)); } finally { setIsLoading(false); }
  }
  return { guardar, isLoading };
}

export function useBajaRango() {
  const [isLoading, setIsLoading] = useState(false);
  async function darBaja(_id: string): Promise<void> {
    setIsLoading(true);
    try { await new Promise<void>((res) => setTimeout(res, 500)); } finally { setIsLoading(false); }
  }
  return { darBaja, isLoading };
}
