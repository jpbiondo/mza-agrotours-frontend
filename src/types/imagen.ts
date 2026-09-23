/**
 * Imagen única de una entidad (la portada de un establecimiento, la imagen
 * representativa de un cultivo). El recorrido es el mismo que el de las fotos
 * de actividad —firmar, subir al bucket, reclamar al guardar—, sólo que acá hay
 * una sola y no hay orden que mantener.
 */

/** Cómo la devuelve el backend al leerla (DTOFotosResponse). */
export interface ImagenGuardada {
  /** Key en el bucket; es lo que vuelve al backend para conservarla. */
  key: string;
  nombre: string;
  /**
   * URL para mostrarla. Para las carpetas públicas del bucket es una URL
   * estable; para las privadas, una prefirmada que vence.
   */
  downloadUrl: string;
}

/** Lo que muestra el selector mientras se edita. */
export interface ImagenEnEdicion {
  key: string;
  nombre: string;
  /** Object URL local si es nueva, `downloadUrl` del backend si ya estaba. */
  previewUrl: string;
  /** Sólo las nuevas: el navegador ya las midió. La guardada no lo informa. */
  ancho?: number;
  alto?: number;
  /** Sólo las nuevas. La guardada no trae el peso. */
  bytes?: number;
}

/** Qué acepta un selector de imagen. Se declara una vez por contexto. */
export interface LimitesImagen {
  /** En minúscula y sin punto. Las fija la carpeta del backend. */
  extensiones: readonly string[];
  mimes: readonly string[];
  /** Valor del atributo `accept` del input. */
  accept: string;
  maxBytes: number;
  /** Formatos, para los mensajes. Ej: "JPG o PNG". */
  formatosLabel: string;
  /**
   * Ancho mínimo en píxeles, cuando la imagen se muestra grande y una chica se
   * vería pixelada. Es una regla del cliente: el backend no mira las dimensiones.
   */
  anchoMinimo?: number;
}
