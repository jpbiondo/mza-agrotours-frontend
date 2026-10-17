import type { Deuda, EstadoDeuda } from "@/types/deudas";

export const DEUDA_ESTADO_META: Record<EstadoDeuda, { label: string; tone: "danger" | "warning" | "success" | "info" }> = {
  sin_devolver: { label: "Sin devolver", tone: "danger" },
  parcial: { label: "Devolución parcial", tone: "warning" },
  total: { label: "Devolución total", tone: "success" },
  acuerdo: { label: "Acuerdo medio", tone: "info" },
};

export const DEUDA_ESTADOS_ORDEN: EstadoDeuda[] = ["sin_devolver", "parcial", "acuerdo", "total"];

/**
 * Estados finales: la deuda ya no existe. En `acuerdo` las partes pactaron un
 * monto menor al total y la diferencia se condonó, así que no queda nada por cobrar.
 */
export function deudaSaldada(estado: EstadoDeuda): boolean {
  return estado === "total" || estado === "acuerdo";
}

/** Lo que todavía se debe: 0 en una deuda saldada, aunque lo devuelto no llegue al total. */
export function pendienteDe(d: Pick<Deuda, "estado" | "montoTotal" | "montoDevuelto">): number {
  return deudaSaldada(d.estado) ? 0 : Math.max(0, d.montoTotal - d.montoDevuelto);
}
