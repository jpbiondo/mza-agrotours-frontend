import type { Productor } from "@/types/productores";

/**
 * Valores de `estadoActual`, espejo del enum `EstadoProductorNombre` del
 * backend. Ojo con el nombre: la suspensión se llama LICENCIA ahí adentro.
 */
export const EstadoProductor = {
  ACTIVO: "ACTIVO",
  /** Suspendido: no puede ingresar, pero conserva su rol y sigue en la finca. */
  LICENCIA: "LICENCIA",
  BAJA: "BAJA",
} as const;

/**
 * `true` si el productor está suspendido.
 *
 * Se acepta también "SUSPENDIDO": LICENCIA es el nombre interno del tramo de
 * estado, y si mañana se renombra al del dominio la tabla no tiene por qué
 * empezar a mostrar a todo el mundo como activo.
 */
export function estaSuspendido(p: Productor): boolean {
  const estado = String(p.estadoActual ?? "").trim().toUpperCase();
  return estado === EstadoProductor.LICENCIA || estado === "SUSPENDIDO";
}

/** Hoy en formato AAAA-MM-DD, que es lo que lee un `<input type="date">`. */
export function hoyISO(): string {
  const n = new Date();
  const p = (x: number) => String(x).padStart(2, "0");
  return `${n.getFullYear()}-${p(n.getMonth() + 1)}-${p(n.getDate())}`;
}

/**
 * Días que faltan hasta `iso` contando por día calendario (0 = vence hoy).
 * `null` si no hay fecha o no se puede leer.
 */
export function diasHasta(iso: string | null): number | null {
  if (!iso) return null;
  const fin = new Date(iso);
  if (Number.isNaN(fin.getTime())) return null;
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  fin.setHours(0, 0, 0, 0);
  return Math.round((fin.getTime() - hoy.getTime()) / 86400000);
}

/**
 * Fecha del `<input type="date">` → `LocalDateTime` del backend.
 *
 * Se manda el final del día elegido: el backend valida `@Future` contra el
 * instante actual, así que una suspensión que termina "hoy" tiene que vencer a
 * la noche y no a las 00:00 de esta mañana, que ya pasó.
 */
export function finDelDia(fecha: string): string {
  return `${fecha}T23:59:00`;
}
