export type NotifTone = "success" | "info" | "warning" | "danger";

/** Códigos de `TipoNotificacionNombre` del backend. */
export type TipoNotificacion =
  | "SOLICITUD_ESTABLECIMIENTO_CREADA"
  | "SOLICITUD_ESTABLECIMIENTO_RECHAZADA"
  | "SOLICITUD_ESTABLECIMIENTO_APROBADA"
  | "PRODUCTOR_AGREGADO"
  | "RESERVA_CANCELADA_POR_BAJA_ACTIVIDAD";

export interface Notificacion {
  id: string;
  /** Crudo, no `TipoNotificacion`: el backend puede sumar tipos que este front
   *  todavía no conoce y una notificación desconocida igual tiene que verse. */
  tipo: string;
  /** Clave de ícono lucide, derivada del tipo. */
  icon: string;
  tone: NotifTone;
  title: string;
  body: string;
  /** ISO crudo del alta, o `null` si no vino. */
  ts: string | null;
  /** Etiqueta legible derivada de `ts` ("Hace 2 h", "Ayer · 19:30"). */
  time: string;
  /** Ruta del front, o `null` si el enlace del backend no mapea a ninguna. */
  href: string | null;
  leida: boolean;
  /** `null` es una notificación personal; con id, es de ese establecimiento. */
  establecimientoId: string | null;
}
