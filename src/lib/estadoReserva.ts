import type { EstadoReservaDia } from "@/types/reservas-dia";

type Tono = "neutral" | "success" | "warning" | "danger" | "info";

/** Cómo se nombra y se pinta cada estado de una reserva para el productor. */
export const ESTADO_RESERVA: Record<EstadoReservaDia, { label: string; tono: Tono }> = {
  pendiente: { label: "Pendiente", tono: "warning" },
  pagada: { label: "Pagada", tono: "info" },
  cancelada_con_reembolso: { label: "Cancelada con reembolso", tono: "neutral" },
  cancelada_sin_reembolso: { label: "Cancelada sin reembolso", tono: "danger" },
  finalizada: { label: "Finalizada", tono: "success" },
  expirada: { label: "Expirada", tono: "neutral" },
};

const ESTADOS_BACKEND: Record<string, EstadoReservaDia> = {
  PENDIENTE: "pendiente",
  PAGADA: "pagada",
  CANCELADA_CON_REEMBOLSO: "cancelada_con_reembolso",
  CANCELADA_SIN_REEMBOLSO: "cancelada_sin_reembolso",
  FINALIZADA: "finalizada",
  EXPIRADA: "expirada",
};

/** `EstadoReservaNombre` del backend; `null` si no es un estado conocido. */
export const aEstadoReserva = (v: unknown): EstadoReservaDia | null =>
  (typeof v === "string" && ESTADOS_BACKEND[v.trim().toUpperCase()]) || null;
