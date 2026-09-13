import type { Estacion } from "@/types/gestionCr";

export const GCR_MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

export const GCR_ESTACIONES: Record<Estacion, { id: Estacion; nombre: string; swatch: string; bg: string; bd: string; fg: string }> = {
  h: { id: "h", nombre: "Cosecha", swatch: "#154212", bg: "var(--green-050)", bd: "var(--green-300)", fg: "var(--green-800)" },
  g: { id: "g", nombre: "Crecimiento", swatch: "#C9A227", bg: "#FBF3D6", bd: "#E6CA72", fg: "#8A6D12" },
  r: { id: "r", nombre: "Reposo", swatch: "#8C7A55", bg: "var(--cream-tert)", bd: "var(--sand)", fg: "var(--brown-700)" },
};
export const GCR_EST_ORDEN: Estacion[] = ["h", "g", "r"];

/** Iniciales para el avatar de una receta. */
export function gcrRecetaInitials(nombre: string): string {
  const skip = new Set(["de", "del", "la", "el", "los", "las", "al", "con", "en", "y", "a"]);
  const w = nombre.split(/\s+/).filter((x) => x && !skip.has(x.toLowerCase()));
  return w.slice(0, 2).map((x) => x[0]).join("").toUpperCase();
}
