import { useState } from "react";
import { useAsync } from "@/hooks/useAsync";
import { RANGO_SEED } from "@/data/rangos";
import type { RangoEtario } from "@/types/rangos";

/** Lista los rangos etarios del sistema. Reemplazar el mock por fetch. */
export function useRangos() {
  return useAsync<RangoEtario[]>(mockFetch);
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
