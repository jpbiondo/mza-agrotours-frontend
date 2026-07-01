import { useAsync } from "@/hooks/useAsync";
import { DEUDAS_SEED } from "@/data/deudas";
import type { Deuda } from "@/types/deudas";

/** Lista las deudas de productores. Reemplazar el mock por fetch. */
export function useDeudas() {
  return useAsync<Deuda[]>(mockFetch);
}

// MOCK — reemplazar por fetch("/api/admin/deudas")
async function mockFetch(): Promise<Deuda[]> {
  await new Promise<void>((res) => setTimeout(res, 500));
  return DEUDAS_SEED.map((d) => ({ ...d }));
}
