import type { Deuda, EstadoDeuda } from "@/types/deudas";

export const DEUDA_ESTADO_META: Record<EstadoDeuda, { label: string; tone: "danger" | "warning" | "success" | "info" }> = {
  sin_devolver: { label: "Sin devolver", tone: "danger" },
  parcial: { label: "Devolución parcial", tone: "warning" },
  total: { label: "Devolución total", tone: "success" },
  acuerdo: { label: "Acuerdo medio", tone: "info" },
};

export const DEUDA_ESTADOS_ORDEN: EstadoDeuda[] = ["sin_devolver", "parcial", "acuerdo", "total"];

export const DEUDAS_SEED: Deuda[] = [
  {
    id: "DEU-4T8C", deudor: "Finca El Algarrobo", montoTotal: 24840, montoDevuelto: 0, estado: "sin_devolver", origen: "Reembolso REM-8K3T cubierto por el sistema",
    historial: [{ estado: "sin_devolver", desde: "2026-06-01T10:10", hasta: null, motivo: "El sistema cubrió el reembolso REM-8K3T al visitante. Se generó la deuda del productor con la plataforma." }],
  },
  {
    id: "DEU-1P5K", deudor: "Viñedo Los Álamos", montoTotal: 13770, montoDevuelto: 6000, estado: "parcial", origen: "Reembolso REM-4M1V cubierto por el sistema",
    historial: [
      { estado: "sin_devolver", desde: "2026-05-28T08:05", hasta: "2026-06-05T12:30", motivo: "El sistema cubrió el reembolso REM-4M1V. Deuda generada." },
      { estado: "parcial", desde: "2026-06-05T12:30", hasta: null, motivo: "El productor realizó un primer pago a cuenta de la deuda.", pago: { pagoId: "PAG-6001-AZ", fecha: "2026-06-05T12:30", monto: 6000 } },
    ],
  },
  {
    id: "DEU-2H9F", deudor: "Bodega Alto Verde", montoTotal: 17010, montoDevuelto: 17010, estado: "total", origen: "Reembolso REM-7B1P cubierto por el sistema",
    historial: [
      { estado: "sin_devolver", desde: "2026-05-10T09:00", hasta: "2026-05-18T16:20", motivo: "El sistema cubrió el reembolso REM-7B1P. Deuda generada." },
      { estado: "parcial", desde: "2026-05-18T16:20", hasta: "2026-06-02T11:05", motivo: "Pago parcial recibido.", pago: { pagoId: "PAG-8000-KM", fecha: "2026-05-18T16:20", monto: 8000 } },
      { estado: "total", desde: "2026-06-02T11:05", hasta: null, motivo: "El productor canceló el saldo restante. Deuda saldada.", pago: { pagoId: "PAG-9010-QP", fecha: "2026-06-02T11:05", monto: 9010 } },
    ],
  },
  {
    id: "DEU-7K2M", deudor: "Finca La Escondida", montoTotal: 22000, montoDevuelto: 11000, estado: "acuerdo", origen: "Reembolso REM-5Q9R cubierto por el sistema",
    historial: [
      { estado: "sin_devolver", desde: "2026-05-20T14:00", hasta: "2026-06-01T10:00", motivo: "El sistema cubrió el reembolso REM-5Q9R. Deuda generada." },
      { estado: "acuerdo", desde: "2026-06-01T10:00", hasta: null, motivo: "Se pactó un acuerdo de pago en 2 cuotas. Se registró la primera cuota.", pago: { pagoId: "PAG-1100-LT", fecha: "2026-06-01T10:00", monto: 11000 } },
    ],
  },
  {
    id: "DEU-3R6N", deudor: "Finca El Cerezal", montoTotal: 30600, montoDevuelto: 0, estado: "sin_devolver", origen: "Reembolso REM-2J7L cubierto por el sistema",
    historial: [{ estado: "sin_devolver", desde: "2026-04-30T18:45", hasta: null, motivo: "El sistema cubrió el reembolso REM-2J7L. Deuda generada. Sin pagos a la fecha." }],
  },
  {
    id: "DEU-9B4D", deudor: "Olivícola Don Aldo", montoTotal: 9200, montoDevuelto: 9200, estado: "total", origen: "Reembolso REM-2K1H cubierto por el sistema",
    historial: [
      { estado: "sin_devolver", desde: "2026-04-12T10:00", hasta: "2026-04-20T09:30", motivo: "El sistema cubrió el reembolso REM-2K1H. Deuda generada." },
      { estado: "total", desde: "2026-04-20T09:30", hasta: null, motivo: "El productor devolvió el total de la deuda en un único pago.", pago: { pagoId: "PAG-9200-RX", fecha: "2026-04-20T09:30", monto: 9200 } },
    ],
  },
];

/** Solo "Sin devolver" y "Devolución parcial" admiten pago/acuerdo. */
export function deudaAccionable(estado: EstadoDeuda): boolean {
  return estado === "sin_devolver" || estado === "parcial";
}
