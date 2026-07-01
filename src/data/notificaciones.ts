import type { Notificacion } from "@/types/notificaciones";

/** Notificaciones del visitante (US-CUENTA-03). Orden por ts descendente. */
export const NOTIFICACIONES: Notificacion[] = [
  { id: "n01", icon: "calendar-check", tone: "success", title: "Reserva confirmada", body: "Tu lugar para la cosecha de Malbec del 21/06 quedó confirmado.", ts: "2026-06-22T16:05", time: "Hace 2 h", href: "/mis-reservas" },
  { id: "n02", icon: "message-circle", tone: "info", title: "Nuevo mensaje", body: "Finca La Escondida respondió tu consulta sobre la visita.", ts: "2026-06-22T11:40", time: "Hoy · 11:40", href: "/mis-reservas" },
  { id: "n03", icon: "star", tone: "warning", title: "Contanos cómo te fue", body: "Dejá tu reseña de la degustación entre hileras.", ts: "2026-06-21T19:30", time: "Ayer · 19:30", href: "/mis-reservas" },
  { id: "n04", icon: "clock", tone: "warning", title: "Tu actividad es mañana", body: "Poda en altura en Finca Los Álamos · 08:30. ¡No faltes!", ts: "2026-06-21T09:00", time: "Ayer · 09:00", href: "/mis-reservas" },
  { id: "n05", icon: "calendar-days", tone: "info", title: "Nueva actividad cerca tuyo", body: "Vendimia nocturna en Valle de Uco, este sábado.", ts: "2026-06-20T14:15", time: "20/06 · 14:15", href: "/explorar" },
  { id: "n06", icon: "credit-card", tone: "success", title: "Pago acreditado", body: "Recibimos el pago de tu reserva RES-2K9F.", ts: "2026-06-19T18:50", time: "19/06 · 18:50", href: "/mis-reservas" },
  { id: "n07", icon: "calendar-x", tone: "warning", title: "Actividad reprogramada", body: "La cosecha de Bonarda se movió al 28/06 por lluvia.", ts: "2026-06-18T10:05", time: "18/06 · 10:05", href: "/mis-reservas" },
  { id: "n08", icon: "message-circle", tone: "info", title: "Nuevo mensaje", body: "Bodega Viento Sur te compartió indicaciones para llegar.", ts: "2026-06-17T16:22", time: "17/06 · 16:22", href: "/mis-reservas" },
  { id: "n09", icon: "sprout", tone: "success", title: "Sumaste puntos de cosechero", body: "Ganaste 120 puntos por tu última experiencia.", ts: "2026-06-15T12:00", time: "15/06 · 12:00", href: "/explorar" },
  { id: "n10", icon: "users", tone: "info", title: "Cupos casi agotados", body: "Quedan 3 lugares para la degustación de torrontés.", ts: "2026-06-14T09:30", time: "14/06 · 09:30", href: "/explorar" },
  { id: "n11", icon: "calendar-check", tone: "success", title: "Reserva confirmada", body: "Visita guiada a los viñedos de Maipú · 12/06.", ts: "2026-06-11T20:10", time: "11/06 · 20:10", href: "/mis-reservas" },
  { id: "n12", icon: "star", tone: "warning", title: "Contanos cómo te fue", body: "Reseñá la caminata entre olivares de Finca Los Álamos.", ts: "2026-06-09T17:45", time: "09/06 · 17:45", href: "/mis-reservas" },
  { id: "n13", icon: "credit-card", tone: "success", title: "Pago acreditado", body: "Recibimos el pago de tu reserva RES-1A7C.", ts: "2026-06-06T13:20", time: "06/06 · 13:20", href: "/mis-reservas" },
  { id: "n14", icon: "calendar-days", tone: "info", title: "Nueva actividad cerca tuyo", body: "Taller de elaboración de dulces caseros en Tunuyán.", ts: "2026-06-03T11:05", time: "03/06 · 11:05", href: "/explorar" },
];

export const NOTIF_TONE: Record<string, { bg: string; fg: string }> = {
  success: { bg: "var(--green-050)", fg: "var(--green-800)" },
  info: { bg: "var(--info-fill)", fg: "var(--info-fg)" },
  warning: { bg: "var(--warning-fill)", fg: "var(--warning-fg)" },
};
