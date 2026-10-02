import type { CategoriaReserva } from "@/types/reservas";

/**
 * Estados de las reservas (lista y detalle). El backend ya los manda con el nombre para
 * mostrar, así que la clave es ese mismo texto. Uno que no esté acá cae a tono
 * neutro y cuenta como activa (ver `metaEstadoReserva`).
 */
export const ESTADO_RESERVA_META: Record<
  string,
  { tone: "neutral" | "success" | "warning" | "danger" | "info"; categoria: CategoriaReserva }
> = {
  "Pendiente": { tone: "warning", categoria: "activa" },
  "Pagada": { tone: "info", categoria: "activa" },
  "Finalizada": { tone: "success", categoria: "finalizada" },
  "Expirada": { tone: "neutral", categoria: "cancelada" },
  "Cancelada con reembolso": { tone: "danger", categoria: "cancelada" },
  "Cancelada sin reembolso": { tone: "danger", categoria: "cancelada" },
  "Cancelada con reembolso pendiente": { tone: "danger", categoria: "cancelada" },
};

export function metaEstadoReserva(estado: string) {
  return ESTADO_RESERVA_META[estado] ?? { tone: "neutral" as const, categoria: "activa" as const };
}
