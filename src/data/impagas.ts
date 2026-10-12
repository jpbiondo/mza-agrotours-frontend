import type { EstadoReembolso } from "@/types/impagas";

export const ESTADO_META: Record<EstadoReembolso, { label: string; tone: "danger" | "info"; desde: string }> = {
  impago: { label: "Impago", tone: "danger", desde: "Impago desde" },
  sistema: { label: "Reembolso sistema", tone: "info", desde: "Pagado el" },
};
