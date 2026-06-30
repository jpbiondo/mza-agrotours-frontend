import type { EstadoReembolso, Reembolso } from "@/types/impagas";

export const IMPAGOS: Reembolso[] = [
  { id: "REM-9F4K", estado: "impago", visitante: "Camila Ríos", visitanteEmail: "camila.rios@example.com", finca: "Finca La Escondida", actividad: "Cosecha de Malbec al amanecer", monto: 24800, fechaPedido: "2026-06-10T08:42", fechaReembolso: null },
  { id: "REM-3X8M", estado: "impago", visitante: "Lucía Britos", visitanteEmail: "lubritos@example.com", finca: "Viñedo Los Álamos", actividad: "Poda de invierno en hilera", monto: 32400, fechaPedido: "2026-06-04T17:05", fechaReembolso: null },
  { id: "REM-1C2D", estado: "impago", visitante: "Tomás Vera", visitanteEmail: "tomas.vera@example.com", finca: "Finca La Escondida", actividad: "Cosecha de Malbec al amanecer", monto: 12400, fechaPedido: "2026-06-18T11:20", fechaReembolso: null },
  { id: "REM-7B1P", estado: "pedido", visitante: "Mateo Sosa", visitanteEmail: "mateososa@example.com", finca: "Bodega Alto Verde", actividad: "Degustación maridada de tres pasos", monto: 18900, fechaPedido: "2026-06-12T09:15", fechaReembolso: null },
  { id: "REM-6H2N", estado: "pedido", visitante: "Valentina Ferrari", visitanteEmail: "valen.ferrari@example.com", finca: "Viñedo Los Álamos", actividad: "Vendimia en familia", monto: 41200, fechaPedido: "2026-06-14T16:48", fechaReembolso: null },
  { id: "REM-5Q9R", estado: "reembolsado", visitante: "Familia López", visitanteEmail: "lopezflia@example.com", finca: "Finca La Escondida", actividad: "Vendimia en familia", monto: 41200, fechaPedido: "2026-06-01T10:30", fechaReembolso: "2026-06-04T13:12" },
  { id: "REM-2J7L", estado: "reembolsado", visitante: "Renata Páez", visitanteEmail: "renapaez@example.com", finca: "Bodega Alto Verde", actividad: "Degustación maridada de tres pasos", monto: 18900, fechaPedido: "2026-05-22T08:00", fechaReembolso: "2026-05-24T19:40" },
  { id: "REM-8K3T", estado: "sistema", visitante: "Joaquín Méndez", visitanteEmail: "joaco.mendez@example.com", finca: "Finca El Algarrobo", actividad: "Cosecha de olivos y degustación", monto: 27600, fechaPedido: "2026-05-02T09:55", fechaReembolso: "2026-06-01T10:10", deudaId: "DEU-4T8C", pago: { pagoId: "PSP-7XQ2-90431", fecha: "2026-06-01T10:10", monto: 27600, visitante: "Joaquín Méndez" } },
  { id: "REM-4M1V", estado: "sistema", visitante: "Sofía Aguirre", visitanteEmail: "sofia.aguirre@example.com", finca: "Viñedo Los Álamos", actividad: "Poda de invierno en hilera", monto: 15300, fechaPedido: "2026-04-28T14:22", fechaReembolso: "2026-05-28T08:05", deudaId: "DEU-1P5K", pago: { pagoId: "PSP-7XQ2-88107", fecha: "2026-05-28T08:05", monto: 15300, visitante: "Sofía Aguirre" } },
];

/** Comisión que el sistema retiene; la deuda del productor = monto − comisión. */
export const COMISION_SISTEMA = 0.1;

export const ESTADO_META: Record<EstadoReembolso, { label: string; tone: "danger" | "warning" | "success" | "info" }> = {
  impago: { label: "Impago", tone: "danger" },
  pedido: { label: "Pedido", tone: "warning" },
  reembolsado: { label: "Reembolsado", tone: "success" },
  sistema: { label: "Reembolso sistema", tone: "info" },
};

/** Vencimiento = 30 días después del pedido (ISO). */
export function vencimiento(isoPedido: string): string {
  const d = new Date(isoPedido);
  d.setDate(d.getDate() + 30);
  return d.toISOString().slice(0, 16);
}

const HOY = new Date("2026-06-23T00:00");

export function estaVencido(r: Reembolso): boolean {
  if (r.estado !== "impago" && r.estado !== "pedido") return false;
  return new Date(vencimiento(r.fechaPedido)) < HOY;
}
