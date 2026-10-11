import type { NotifTone } from "@/types/notificaciones";

/**
 * Cómo se pinta cada tipo de notificación. El backend manda el código de
 * `TipoNotificacionNombre` y nada sobre su aspecto, así que el ícono y el tono
 * salen de acá. Sumar un tipo del backend es sumar una fila.
 */
export const NOTIF_PRESENTACION: Record<string, { icon: string; tone: NotifTone }> = {
  SOLICITUD_ESTABLECIMIENTO_CREADA: { icon: "file-clock", tone: "info" },
  SOLICITUD_ESTABLECIMIENTO_APROBADA: { icon: "file-check", tone: "success" },
  SOLICITUD_ESTABLECIMIENTO_RECHAZADA: { icon: "file-x", tone: "danger" },
  // Para la administración: hay algo esperando una revisión.
  SOLICITUD_ESTABLECIMIENTO_POR_REVISAR: { icon: "file-search", tone: "warning" },
  PRODUCTOR_AGREGADO: { icon: "users", tone: "success" },
  RESERVA_CANCELADA_POR_BAJA_ACTIVIDAD: { icon: "calendar-x", tone: "danger" },
};

/** Un tipo que el front no conoce se muestra igual, en neutro. */
export const NOTIF_PRESENTACION_DEFAULT: { icon: string; tone: NotifTone } = {
  icon: "bell",
  tone: "info",
};

/** Clases de fondo (cuadrado del ícono) y de color (el ícono) por tono. */
export const NOTIF_TONE: Record<NotifTone, { bg: string; fg: string }> = {
  success: { bg: "bg-green-050", fg: "text-green-800" },
  info: { bg: "bg-info-fill", fg: "text-info-fg" },
  warning: { bg: "bg-warning-fill", fg: "text-warning-fg" },
  danger: { bg: "bg-danger-fill", fg: "text-danger-fg" },
};
