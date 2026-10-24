import { z } from "zod";
import type { DatosParametros, Parametros } from "@/types/parametros";

/** El tope de un `Integer` de Java: más arriba el backend no lo puede leer. */
const ENTERO_MAX = 2_147_483_647;

/** `NumberField` sólo deja escribir dígitos, así que alcanza con mirar el rango. */
const entero = (min: 0 | 1) =>
  z
    .string()
    .min(1, "Completá este campo.")
    .refine((v) => Number(v) >= min, min === 1 ? "Tiene que ser mayor a 0." : "No puede ser negativo.")
    .refine((v) => Number(v) <= ENTERO_MAX, "Es un número demasiado grande.");

/** "12,25" → 12.25; `null` si está vacío. `NumberField` ya acota a dos decimales. */
export function leerPorcentaje(v: string): number | null {
  const t = v.trim();
  if (!t) return null;
  const n = Number(t.replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

/**
 * Espejo de las validaciones del DTO del backend. Los números van como texto
 * porque así los maneja `NumberField` ("" es vacío, no 0).
 */
export const parametrosSchema = z.object({
  comision: z
    .string()
    .min(1, "Completá este campo.")
    .refine((v) => {
      const n = leerPorcentaje(v);
      return n !== null && n <= 100;
    }, "Tiene que estar entre 0 y 100."),
  diasMaxActividad: entero(1),
  diasMinReembolso: entero(0),
  ttlReserva: entero(1),
  diasImpago: entero(1),
});

export type ParametrosForm = z.infer<typeof parametrosSchema>;

/** Lo guardado → el formulario. Un parámetro sin cargar arranca vacío. */
export function aFormulario(p: Parametros): ParametrosForm {
  const num = (n: number | null) => (n === null ? "" : String(n));
  return {
    comision: p.comision === null ? "" : String(p.comision).replace(".", ","),
    diasMaxActividad: num(p.diasMaxActividad),
    diasMinReembolso: num(p.diasMinReembolso),
    ttlReserva: num(p.ttlReserva),
    diasImpago: num(p.diasImpago),
  };
}

/** El formulario ya validado → lo que se guarda. */
export function aDatos(f: ParametrosForm): DatosParametros {
  return {
    comision: leerPorcentaje(f.comision) ?? 0,
    diasMaxActividad: Number(f.diasMaxActividad),
    diasMinReembolso: Number(f.diasMinReembolso),
    ttlReserva: Number(f.ttlReserva),
    diasImpago: Number(f.diasImpago),
  };
}

export const reautenticarSchema = z.object({
  pass: z.string().min(1, "Ingresá tu contraseña para continuar."),
});

export type ReautenticarForm = z.infer<typeof reautenticarSchema>;
