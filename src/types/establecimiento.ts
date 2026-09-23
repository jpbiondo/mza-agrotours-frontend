/**
 * Contratos de la carga de pruebas documentales. El backend no recibe los
 * archivos: firma una URL por archivo en
 * `POST /solicitudes-establecimiento/archivos/presign`, el navegador los sube
 * directo al object storage y después el alta de la solicitud manda sólo las
 * keys para que las reclame.
 */

/** Item de `archivos` en el request (DTO ArchivoUploadRequest). */
export interface ArchivoUploadRequest {
  /** Nombre completo, con extensión. Ej: "constancia.pdf". */
  filename: string;
  contentType: string;
  /** Tamaño en bytes. */
  fileSize: number;
}

/** URL prefirmada para subir un archivo al object storage (DTO ArchivoUploadResponse). */
export interface ArchivoUploadResponse {
  /** Destino del PUT. Ya viene firmada: no lleva Authorization. */
  uploadUrl: string;
  /** Ruta del objeto en el proveedor de almacenamiento. */
  key: string;
  /** Extensión esperada. Puede venir con o sin punto inicial. */
  extension: string;
  /** Nombre del archivo. Puede venir con o sin la extensión incluida. */
  nombre: string;
  /**
   * Content type que el backend metió DENTRO de la firma —lo deduce de la
   * extensión, el cliente no lo elige—, así que el PUT tiene que repetir este
   * y no uno calculado acá. Opcional porque los endpoints viejos no lo mandan.
   */
  contentType?: string;
}

/**
 * `data` del envelope 2xx (DTO SolicitudEstablecimientoCreateResp). Ya no trae
 * URLs de subida: para cuando el POST corre, los archivos ya están en el bucket
 * (ver `useSolicitarEstablecimiento`).
 */
export interface SolicitudEstablecimientoCreateResp {
  solicitudId: string;
  /** Razón social del establecimiento (así lo documenta el backend). */
  nombreEstablecimiento: string;
}

/** Todo lo necesario para subir —o reintentar— un archivo. */
export interface ItemSubida {
  /** Nombre tal cual lo ve el usuario (File.name). */
  nombre: string;
  /** El File original: el reintento reusa el mismo blob, sin re-seleccionar. */
  file: File;
  /** `null` si el backend no devolvió una respuesta para este archivo. */
  uploadUrl: string | null;
  /** Clave en el storage; sirve de key estable en listas de React. */
  storageKey: string | null;
  /** Content-Type declarado al backend; debe repetirse en el PUT. */
  contentType: string;
}

/** Un ItemSubida que falló, con el diagnóstico. */
export interface ArchivoFallido extends ItemSubida {
  /** Diagnóstico interno (status HTTP o error de red). No se muestra al usuario. */
  motivo: string;
}

export interface SubirArchivosResultado {
  subidos: number;
  total: number;
  fallidos: ArchivoFallido[];
}
