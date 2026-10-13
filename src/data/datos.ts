import type { LimitesImagen } from "@/types/imagen";

/* ---- Portada del establecimiento -----------------------------------------
   Una sola imagen, la primera que ven los visitantes en el perfil público y en
   las tarjetas de búsqueda, que la muestran en 16:9. */

/**
 * Los formatos salen de `CarpetaArchivo.ESTABLECIMIENTOS` del backend, que
 * rechaza cualquier otro al firmar la subida. El diseño también ofrecía WEBP,
 * pero el backend todavía no lo acepta.
 */
export const PORTADA_EXTENSIONES = ["jpg", "jpeg", "png"] as const;
export const PORTADA_MIMES = ["image/jpeg", "image/png"] as const;
export const PORTADA_ACCEPT = PORTADA_MIMES.join(",");

/** Mismo tope que la carpeta del backend. */
export const PORTADA_MAX_BYTES = 5 * 1024 * 1024; // 5 MB

/**
 * Debajo de este ancho la portada se ve pixelada donde se usa. Es una regla del
 * cliente: el backend no mira las dimensiones.
 */
export const PORTADA_ANCHO_MINIMO = 1200;

export const LIMITES_PORTADA: LimitesImagen = {
  extensiones: PORTADA_EXTENSIONES,
  mimes: PORTADA_MIMES,
  accept: PORTADA_ACCEPT,
  maxBytes: PORTADA_MAX_BYTES,
  formatosLabel: "JPG o PNG",
  anchoMinimo: PORTADA_ANCHO_MINIMO,
};
