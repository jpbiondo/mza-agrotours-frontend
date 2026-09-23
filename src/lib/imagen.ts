import type { ImagenGuardada } from "@/types/imagen";

/**
 * `DTOFotosResponse` → `ImagenGuardada`. Sin `key` la imagen no se puede
 * conservar al guardar —el PUT reemplaza el estado completo—, así que se
 * descarta entera.
 *
 * Convive con `aFoto` de `useCatalogoActividades`, que mapea el MISMO DTO pero
 * al vocabulario del catálogo público (`FotoRef`, con `url` en vez de
 * `downloadUrl`). Son dos lecturas del mismo contrato: ésta para las pantallas
 * que además escriben la imagen, aquélla para las que sólo la muestran.
 */
export function aImagenGuardada(v: unknown): ImagenGuardada | null {
  if (!v || typeof v !== "object") return null;
  const f = v as { key?: unknown; nombre?: unknown; downloadUrl?: unknown };
  if (typeof f.key !== "string" || !f.key) return null;
  return {
    key: f.key,
    nombre: typeof f.nombre === "string" ? f.nombre : "",
    downloadUrl: typeof f.downloadUrl === "string" ? f.downloadUrl : "",
  };
}
