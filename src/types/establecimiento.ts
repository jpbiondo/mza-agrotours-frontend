/**
 * Contratos de POST /solicitudes-establecimiento/create en lo referido a la
 * carga de pruebas documentales. El backend no recibe los archivos: devuelve
 * una URL prefirmada por archivo y el navegador los sube directo al object
 * storage (ver `useSubirArchivos`).
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
}

/** `data` del envelope 2xx (DTO SolicitudEstablecimientoCreateResp). */
export interface SolicitudEstablecimientoCreateResp {
  solicitudId: string;
  /** Razón social del establecimiento (así lo documenta el backend). */
  nombreEstablecimiento: string;
  archivoUploadResponses: ArchivoUploadResponse[];
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
