import { useState } from "react";
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

/** Confirma una reserva pendiente (queda pagada/confirmada). */
export function useConfirmarReserva() {
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function confirmar(reservaId: string): Promise<void> {
    setPendingId(reservaId);
    try {
      await mockConfirmar(reservaId);
    } finally {
      setPendingId(null);
    }
  }

  return { confirmar, pendingId };
}

// MOCK — reemplazar por fetch(`/api/reservas/${id}/confirmar`, { method: "POST" })
async function mockConfirmar(_reservaId: string): Promise<void> {
  await new Promise<void>((res) => setTimeout(res, 700));
}
