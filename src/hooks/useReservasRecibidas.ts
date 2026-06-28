import { useEffect, useState } from "react";
import { RESERVAS_RECIBIDAS } from "@/data/panel-reservas";
import type { ReservaProd } from "@/types/panel-reservas";

interface UseReservasRecibidasReturn {
  data: ReservaProd[] | null;
  isLoading: boolean;
  error: string | null;
}

/** Reservas recibidas por el establecimiento activo. Reemplazar el mock por fetch. */
export function useReservasRecibidas(fincaId: string): UseReservasRecibidasReturn {
  const [state, setState] = useState<{ fincaId: string; data: ReservaProd[] | null; error: string | null }>({
    fincaId: "", data: null, error: null,
  });

  useEffect(() => {
    let active = true;
    mockFetch(fincaId)
      .then((d) => { if (active) setState({ fincaId, data: d, error: null }); })
      .catch((e: unknown) => { if (active) setState({ fincaId, data: null, error: e instanceof Error ? e.message : "Error inesperado" }); });
    return () => { active = false; };
  }, [fincaId]);

  const isLoading = state.fincaId !== fincaId;
  return { data: isLoading ? null : state.data, error: isLoading ? null : state.error, isLoading };
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
