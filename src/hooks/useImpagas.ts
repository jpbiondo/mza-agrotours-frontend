import { useState } from "react";
import { useAsync } from "@/hooks/useAsync";
import { IMPAGOS } from "@/data/impagas";
import type { Reembolso, ReembolsoForm } from "@/types/impagas";

/** Lista los reembolsos (reservas impagas). Reemplazar el mock por fetch. */
export function useImpagas() {
  return useAsync<Reembolso[]>(mockFetch);
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
