/**
 * Fotos de una actividad.
 *
 * El backend no recibe imágenes: firma una URL por archivo
 * (`POST .../actividades/archivos/presign`), el navegador las sube derecho al
 * bucket y recién al guardar la actividad se le manda la lista de keys para
 * que las "reclame" (`ArchivoClaimRequest` / `DTOActividadFotoReq`).
 *
 * **El orden del arreglo es el orden de las fotos.** El backend asigna
 * `ActividadFoto.orden` con el índice de la lista que recibe, y las devuelve
 * ordenadas; no hay ningún campo `orden` que mandar.
 */

/** Lo que viaja por foto al guardar. Ni más ni menos: `{ key, nombre }`. */
export interface FotoClaim {
  /** La emitió el backend al firmar. El cliente nunca elige dónde se guarda. */
  key: string;
  /** El nombre original del usuario; sólo se usa para mostrarlo. */
  nombre: string;
}

/**
 * Dónde está una foto en su viaje al bucket. Como la subida arranca al
 * soltarla, una foto puede estar a medio camino mientras se reordena el resto.
 */
export type EstadoFoto = "subiendo" | "lista" | "error";

/** Una foto tal como la ve el uploader, esté ya guardada o recién elegida. */
export interface FotoActividad {
  /** Identifica el tile mientras se arrastra. Del cliente: no viaja al backend. */
  id: string;
  nombre: string;
  /** `null` mientras no se sepa la key (la subida todavía no llegó a firmarse). */
  key: string | null;
  /**
   * Qué dibuja la miniatura: una object URL local para las nuevas, la
   * `downloadUrl` del backend para las que ya estaban guardadas.
   */
  previewUrl: string;
  estado: EstadoFoto;
  /**
   * El File original. Sólo lo tienen las nuevas, y es lo que permite
   * reintentar sin volver a elegir el archivo. Su presencia distingue una foto
   * nueva —cuya object URL hay que revocar— de una que vino del backend.
   */
  file?: File;
  /** Destino del PUT. Se conserva para el reintento. */
  uploadUrl?: string;
  /** Content type que firmó el backend; hay que repetirlo tal cual en el PUT. */
  contentType?: string;
  /** Diagnóstico técnico del fallo (status o error de red). No se le muestra al usuario. */
  motivo?: string;
}
