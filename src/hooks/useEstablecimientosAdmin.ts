import { useState } from "react";
import { useAsync } from "@/hooks/useAsync";
import { ADMIN_SEED_ESTAB } from "@/data/admin";
import type { AdminEstab } from "@/types/admin";

/** Lista los establecimientos de la plataforma para moderación. Reemplazar el mock por fetch. */
export function useEstablecimientosAdmin() {
  return useAsync<AdminEstab[]>(mockFetch);
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
