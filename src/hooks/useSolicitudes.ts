import { useState } from "react";
import { useAsync } from "@/hooks/useAsync";
import { SOLICITUDES_SEED } from "@/data/solicitudes";
import type { Solicitud } from "@/types/solicitudes";

/** Lista las solicitudes de alta de establecimientos. Reemplazar el mock por fetch. */
export function useSolicitudes() {
  return useAsync<Solicitud[]>(mockFetch);
}

// MOCK — reemplazar por fetch("/api/admin/solicitudes")
async function mockFetch(): Promise<Solicitud[]> {
  await new Promise<void>((res) => setTimeout(res, 500));
  return SOLICITUDES_SEED.map((s) => ({ ...s }));
}

/** Aprueba o rechaza una solicitud. */
export function useResolverSolicitud() {
  const [isLoading, setIsLoading] = useState(false);
  async function resolver(_id: string, _estado: "validada" | "rechazada", _observacion: string): Promise<void> {
    setIsLoading(true);
    try { await new Promise<void>((res) => setTimeout(res, 700)); } finally { setIsLoading(false); }
  }
  return { resolver, isLoading };
}
