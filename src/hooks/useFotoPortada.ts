import { useImagenUnica, type UseImagenUnicaReturn } from "@/hooks/useImagenUnica";
import { LIMITES_PORTADA } from "@/data/datos";
import type { ImagenEnEdicion } from "@/types/imagen";
import type { FotoPortada } from "@/types/datos";

/**
 * Portada del establecimiento. Es `useImagenUnica` con el endpoint de firma del
 * establecimiento —`/archivos/presign`, sólo para el titular— y sus límites.
 */

/** @deprecated Usá `ImagenEnEdicion`. Se conserva por los usos existentes. */
export type PortadaEnEdicion = ImagenEnEdicion;

function presignPath(establecimientoId: string): string {
  return `/establecimientos/${encodeURIComponent(establecimientoId)}/archivos/presign`;
}

export function useFotoPortada(
  establecimientoId: string,
  inicial: FotoPortada | null,
): UseImagenUnicaReturn {
  return useImagenUnica(presignPath(establecimientoId), LIMITES_PORTADA, inicial);
}
