import type { EstadoReembolso, MetodoPago } from "@/types/impagas";

export const METODO_PAGO_LABEL: Record<MetodoPago, string> = {
  manual: "Transferencia manual",
  mercadoPago: "Mercado Pago",
};

export const ESTADO_META: Record<EstadoReembolso, { label: string; tone: "danger" | "info"; desde: string }> = {
  impago: { label: "Impago", tone: "danger", desde: "Impago desde" },
  sistema: { label: "Reembolso sistema", tone: "info", desde: "Pagado el" },
};
