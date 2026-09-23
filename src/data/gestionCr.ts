import type { Estacion } from "@/types/gestionCr";
import type { LimitesImagen } from "@/types/imagen";

/* ---- Imagen representativa del cultivo -----------------------------------
   Se muestra en el listado público y en la ficha del cultivo. */

/**
 * Los formatos salen de `CarpetaArchivo.CULTIVOS` del backend, que rechaza
 * cualquier otro al firmar la subida. El diseño también ofrecía WEBP, pero el
 * backend todavía no lo acepta.
 */
const CULTIVO_EXTENSIONES = ["jpg", "jpeg", "png"] as const;
const CULTIVO_MIMES = ["image/jpeg", "image/png"] as const;

export const LIMITES_IMAGEN_CULTIVO: LimitesImagen = {
  extensiones: CULTIVO_EXTENSIONES,
  mimes: CULTIVO_MIMES,
  accept: CULTIVO_MIMES.join(","),
  // 3 MB y no los 5 que tolera la carpeta: lo pide el diseño, y es de sobra
  // para una imagen que se muestra recortada a 4:3.
  maxBytes: 3 * 1024 * 1024,
  formatosLabel: "JPG o PNG",
};

/**
 * Imagen de la receta. Mismos formatos y mismo tope que la del cultivo: las dos
 * salen del mismo selector del diseño y de carpetas con las mismas reglas
 * (`CarpetaArchivo.RECETAS` tolera 5 MB, pero el diseño pide 3).
 */
export const LIMITES_IMAGEN_RECETA: LimitesImagen = LIMITES_IMAGEN_CULTIVO;

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
