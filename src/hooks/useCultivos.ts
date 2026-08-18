import { useAsync } from "@/hooks/useAsync";
import { CULTIVOS } from "@/data/cultivos";
import type { Cultivo } from "@/types/cultivos";

/** Lista los cultivos del catálogo. Reemplazar el mock por un fetch real. */
export function useCultivos() {
  return useAsync<Cultivo[]>(mockFetch);
}

// MOCK — reemplazar por fetch("/api/cultivos")
async function mockFetch(): Promise<Cultivo[]> {
  await new Promise<void>((res) => setTimeout(res, 500));
  return CULTIVOS;
}
