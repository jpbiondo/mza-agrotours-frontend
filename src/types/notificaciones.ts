export type NotifTone = "success" | "info" | "warning";

export interface Notificacion {
  id: string;
  /** Clave de ícono lucide. */
  icon: string;
  tone: NotifTone;
  title: string;
  body: string;
  /** ISO de recepción (para ordenar desc). */
  ts: string;
  /** Etiqueta legible ("Hace 2 h", "Ayer · 19:30"). */
  time: string;
  /** Ruta destino al hacer click. */
  href: string;
}
