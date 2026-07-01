import { useState } from "react";
import { useAsync } from "@/hooks/useAsync";
import { RESERVAS } from "@/data/reservas";
import type { Reserva } from "@/types/reservas";

/** Lista las reservas del visitante. Reemplazar mockFetch por un fetch real. */
export function useReservas() {
  return useAsync<Reserva[]>(mockFetchReservas);
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
