import type { MesCalendario } from "@/types/catalogo";

/** "Hoy" de referencia para calcular edades y la ventana de reembolso. */
export const HOY = new Date(2026, 5, 21); // 21/06/2026

export const TIPOS_DOC = ["DNI", "Pasaporte", "Otro"];

export interface Viajero {
  nombre: string;
  fechaNac: string;
  tipoDoc: string;
  numDoc: string;
}

/** Los rangos etarios los define el productor por actividad: no hay un set fijo. */
export type RangoId = string;

export interface Rango {
  id: RangoId;
  label: string;
  sub: string;
  min: number;
  max: number;
}

/** Precios por rango etario. null = el productor no habilitó el rango. */
export type Precios = Record<RangoId, number | null>;

export function precioRango(precios: Precios, id: RangoId): number {
  return precios[id] ?? 0;
}

/** Un rango está permitido si el productor le fijó un precio (no null). */
export function rangoPermitido(precios: Precios, id: RangoId): boolean {
  return precios[id] != null;
}

/** Edad en años cumplidos a partir de una fecha ISO (YYYY-MM-DD) contra HOY. */
export function edadEnAnios(iso: string): number | null {
  if (!iso) return null;
  const d = new Date(iso + "T00:00:00");
  if (isNaN(d.getTime())) return null;
  let e = HOY.getFullYear() - d.getFullYear();
  const m = HOY.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && HOY.getDate() < d.getDate())) e--;
  return e;
}

export function rangoParaEdad(edad: number | null, rangos: Rango[]): Rango | null {
  if (edad == null || edad < 0) return null;
  return rangos.find((r) => edad >= r.min && edad <= r.max) || null;
}

export interface EvalViajero {
  edad: number | null;
  rango: Rango | null;
  permitido: boolean;
  subtotal: number;
  completo: boolean;
}

export function evalViajero(v: Viajero, precios: Precios, rangos: Rango[]): EvalViajero {
  const edad = edadEnAnios(v.fechaNac);
  const rango = rangoParaEdad(edad, rangos);
  const permitido = !!(rango && rangoPermitido(precios, rango.id));
  const subtotal = permitido && rango ? precioRango(precios, rango.id) : 0;
  const completo = !!(v.nombre.trim() && v.fechaNac && rango && permitido && v.numDoc.trim());
  return { edad, rango, permitido, subtotal, completo };
}

/** Información de una actividad para armar la pantalla de reserva (GET /actividades/{id}/reservar). */
export interface InfoParaReservar {
  nombre: string;
  ubicacion: string;
  nombreEstablecimiento: string;
  cupoMaximo: number;
  calificacionPromedio: number;
  diasMinReembolso: number;
  rangos: Rango[];
  precios: Precios;
  calendario: MesCalendario[];
  /** Titular de la cuenta — autocompleta el primer visitante. */
  titular: Viajero;
}

/** dd/mm/yyyy para un día de un mes del calendario. */
export function fechaLabel(mes: MesCalendario, day: number): string {
  return `${String(day).padStart(2, "0")}/${String(mes.month + 1).padStart(2, "0")}/${mes.year}`;
}

/** Código de reserva tipo RES-2K9F. */
export function codigoReserva(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 4; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return "RES-" + s;
}
