import { useState } from "react";
import { codigoReserva } from "@/data/reserva";

export type Outcome = "success" | "cancel" | "fail";

/** Crea la reserva en estado pendiente y devuelve su código. */
export function useCrearReserva() {
  const [isLoading, setIsLoading] = useState(false);

  async function crear(): Promise<string> {
    setIsLoading(true);
    try {
      return await mockCrearReserva();
    } finally {
      setIsLoading(false);
    }
  }

  return { crear, isLoading };
}

// MOCK — reemplazar por fetch("/api/reservas", { method: "POST", body }) → { codigo }
async function mockCrearReserva(): Promise<string> {
  await new Promise<void>((res) => setTimeout(res, 600));
  return codigoReserva();
}

/** Procesa el pago de la reserva en el servicio externo (simulado). */
export function useProcesarPago() {
  const [isLoading, setIsLoading] = useState(false);

  async function procesar(outcome: Outcome): Promise<Outcome> {
    setIsLoading(true);
    try {
      return await mockProcesarPago(outcome);
    } finally {
      setIsLoading(false);
    }
  }

  return { procesar, isLoading };
}

// MOCK — reemplazar por el retorno del servicio de pagos (Mercado Pago)
async function mockProcesarPago(outcome: Outcome): Promise<Outcome> {
  await new Promise<void>((res) => setTimeout(res, 1500));
  return outcome;
}
