import { useEffect, useState } from "react";
import { RESERVAS } from "@/data/reservas";
import type { Reserva } from "@/types/reservas";

interface UseReservasReturn {
  data: Reserva[] | null;
  isLoading: boolean;
  error: string | null;
}

/** Lista las reservas del visitante. Reemplazar mockFetch por un fetch real. */
export function useReservas(): UseReservasReturn {
  const [state, setState] = useState<{ data: Reserva[] | null; error: string | null; loaded: boolean }>({
    data: null, error: null, loaded: false,
  });

  useEffect(() => {
    let active = true;
    mockFetchReservas()
      .then((d) => { if (active) setState({ data: d, error: null, loaded: true }); })
      .catch((e: unknown) => { if (active) setState({ data: null, error: e instanceof Error ? e.message : "Error inesperado", loaded: true }); });
    return () => { active = false; };
  }, []);

  return { data: state.data, error: state.error, isLoading: !state.loaded };
}

// MOCK — reemplazar por fetch("/api/reservas")
async function mockFetchReservas(): Promise<Reserva[]> {
  await new Promise<void>((res) => setTimeout(res, 600));
  return RESERVAS;
}

/* ---- Mutaciones -------------------------------------------------------- */

export function useCancelarReserva() {
  const [isLoading, setIsLoading] = useState(false);

  async function cancelar(reservaId: string): Promise<void> {
    setIsLoading(true);
    try {
      await mockCancelar(reservaId);
    } finally {
      setIsLoading(false);
    }
  }

  return { cancelar, isLoading };
}

// MOCK — reemplazar por fetch(`/api/reservas/${id}/cancelar`, { method: "POST" })
async function mockCancelar(_reservaId: string): Promise<void> {
  await new Promise<void>((res) => setTimeout(res, 700));
}

export interface ValoracionPayload {
  reservaId: string;
  rating: number;
  comentario: string;
}

export function useValorarActividad() {
  const [isLoading, setIsLoading] = useState(false);

  async function valorar(payload: ValoracionPayload): Promise<void> {
    setIsLoading(true);
    try {
      await mockValorar(payload);
    } finally {
      setIsLoading(false);
    }
  }

  return { valorar, isLoading };
}

// MOCK — reemplazar por fetch(`/api/reservas/${reservaId}/valoracion`, { method: "POST", body })
async function mockValorar(_payload: ValoracionPayload): Promise<void> {
  await new Promise<void>((res) => setTimeout(res, 1000));
}
