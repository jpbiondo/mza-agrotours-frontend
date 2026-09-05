import { useState } from "react";
import { auth } from "../../firebase.config";
import { apiFetch, ApiError } from "@/lib/api";
import { ConsultarReserva } from "./useReservas";

interface IniciarReserva{
  reservaDTO: ConsultarReserva;
  preferenceId: string;
}

interface ReservarResponse{
  ok: boolean;
  code?: string;
  data?: IniciarReserva;
}

interface cancelarPagoResponse{
  ok: boolean;
  code?: string;
  data?: null;
}

export interface RealizarReservaRequest{
  diaActividadId: string;
  reservaDetalleList: RealizarReservaRequestDetalle[]
}
export interface RealizarReservaRequestDetalle{
  nombreApellido: string;
  identificacion: string;
  tipoIdentificacion: string;
  fechaNacimiento: string;
}

/** Crea la reserva en estado pendiente (POST /reserva/reservar): detalle + preferenceId de Mercado Pago. */
export function useReserva() {
  const [isLoading, setIsLoading] = useState(false);

  async function crear(request: RealizarReservaRequest): Promise<ReservarResponse> {
    setIsLoading(true);
    try {
      return await crearReserva(request);
    } finally {
      setIsLoading(false);
    }
  }

  async function cancelarPago(preferenceId: String): Promise<cancelarPagoResponse>{
    setIsLoading(true);
    try{
      return await cancelarPagoRequest(preferenceId);
    } finally{
      setIsLoading(false);
    }

  }

  return { crear, cancelarPago, isLoading };
}

async function crearReserva(request: RealizarReservaRequest): Promise<ReservarResponse> {
  const user = auth.currentUser;
  if (!user) throw new Error("Sin sesión");
  const token = await user.getIdToken();

  try {
    return await apiFetch<ReservarResponse>("/reserva/reservar", {
      method: "POST",
      token,
      body: JSON.stringify(request),
    });
  } catch (e) {
    if (e instanceof ApiError) return { ok: false, code: e.code };
    throw e;
  }
}

async function cancelarPagoRequest(preferenceId: String): Promise<cancelarPagoResponse>{
  const user = auth.currentUser;
  if (!user) throw new Error("Sin sesión");
  const token = await user.getIdToken();
  
  try {
    return await apiFetch<cancelarPagoResponse>(`/reserva/cancelarPago/${preferenceId}`, {
      method: "POST",
      token,
    });
  } catch (e) {
    if (e instanceof ApiError) return { ok: false, code: e.code };
    throw e;
  }
}