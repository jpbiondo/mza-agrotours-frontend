import { useEffect, useState } from "react";
import { ADMIN_SEED_ESTAB } from "@/data/admin";
import type { AdminEstab } from "@/types/admin";

interface ListReturn {
  data: AdminEstab[] | null;
  isLoading: boolean;
  error: string | null;
}

/** Lista los establecimientos de la plataforma para moderación. Reemplazar el mock por fetch. */
export function useEstablecimientosAdmin(): ListReturn {
  const [state, setState] = useState<{ data: AdminEstab[] | null; error: string | null; loaded: boolean }>({
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

// MOCK — reemplazar por fetch("/api/admin/establecimientos")
async function mockFetch(): Promise<AdminEstab[]> {
  await new Promise<void>((res) => setTimeout(res, 500));
  return ADMIN_SEED_ESTAB.map((e) => ({ ...e }));
}

/** Suspende o reactiva un establecimiento. */
export function useModerarEstablecimiento() {
  const [isLoading, setIsLoading] = useState(false);
  async function suspender(_id: string, _motivo: string): Promise<void> {
    setIsLoading(true);
    try { await new Promise<void>((res) => setTimeout(res, 650)); } finally { setIsLoading(false); }
  }
  async function reactivar(_id: string): Promise<void> {
    setIsLoading(true);
    try { await new Promise<void>((res) => setTimeout(res, 650)); } finally { setIsLoading(false); }
  }
  return { suspender, reactivar, isLoading };
}
