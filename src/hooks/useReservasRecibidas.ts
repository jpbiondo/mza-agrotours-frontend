import { useAsync } from "@/hooks/useAsync";
import { RESERVAS_RECIBIDAS } from "@/data/panel-reservas";
import type { ReservaProd } from "@/types/panel-reservas";

/** Reservas recibidas por el establecimiento activo. Reemplazar el mock por fetch. */
export function useReservasRecibidas(fincaId: string) {
  return useAsync<ReservaProd[]>(() => mockFetch(fincaId), [fincaId]);
}

// MOCK — reemplazar por fetch(`/api/productor/${fincaId}/reservas`)
async function mockFetch(_fincaId: string): Promise<ReservaProd[]> {
  await new Promise<void>((res) => setTimeout(res, 600));
  return RESERVAS_RECIBIDAS;
}
