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
  PRODUCTOR_AGREGADO: { icon: "users", tone: "success" },
  RESERVA_CANCELADA_POR_BAJA_ACTIVIDAD: { icon: "calendar-x", tone: "danger" },
};

/** Un tipo que el front no conoce se muestra igual, en neutro. */
export const NOTIF_PRESENTACION_DEFAULT: { icon: string; tone: NotifTone } = {
  icon: "bell",
  tone: "info",
};

export const NOTIF_TONE: Record<NotifTone, { bg: string; fg: string }> = {
  success: { bg: "var(--green-050)", fg: "var(--green-800)" },
  info: { bg: "var(--info-fill)", fg: "var(--info-fg)" },
  warning: { bg: "var(--warning-fill)", fg: "var(--warning-fg)" },
  danger: { bg: "var(--danger-fill)", fg: "var(--danger-fg)" },
};
