import type { Periodo } from "@/types/estadisticas";

/**
 * Los períodos que ofrece el selector. Los rangos exactos los calcula el
 * backend; acá sólo vive el rótulo, que hace falta antes de que lleguen los datos.
 */
export const PERIODOS: { value: Periodo; label: string }[] = [
  { value: "30d", label: "Últimos 30 días" },
  { value: "6m", label: "Últimos 6 meses" },
  // Doce meses corridos hasta hoy, no el año calendario.
  { value: "12m", label: "Último año" },
];

export function labelPeriodo(value: Periodo): string {
  return PERIODOS.find((p) => p.value === value)?.label ?? "";
}
