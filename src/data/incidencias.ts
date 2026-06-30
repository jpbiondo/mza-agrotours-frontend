import type { EstadoIncidencia, Incidencia } from "@/types/incidencias";

export const GI_ESTADOS: Record<EstadoIncidencia, { label: string; tone: "info" | "warning" | "success" | "neutral" }> = {
  reportada: { label: "Reportada", tone: "info" },
  revision: { label: "En revisión", tone: "warning" },
  resuelta: { label: "Resuelta", tone: "success" },
  desestimada: { label: "Desestimada", tone: "neutral" },
};

export const GI_ORDEN_ESTADOS: EstadoIncidencia[] = ["reportada", "revision", "resuelta", "desestimada"];

export function giEsTerminal(estado: EstadoIncidencia): boolean {
  return estado === "resuelta" || estado === "desestimada";
}

export function giResumen(desc: string, n = 20): string {
  if (!desc) return "";
  return desc.length > n ? desc.slice(0, n).trimEnd() + "…" : desc;
}

export function giOrdenarDesc(lista: Incidencia[]): Incidencia[] {
  return [...lista].sort((a, b) => new Date(b.fechaInicio).getTime() - new Date(a.fechaInicio).getTime());
}

export const GI_SEED: Incidencia[] = [
  { id: "INC-9K2D", titulo: "No puedo subir las fotos de una experiencia", usuario: "Lucía Funes", desc: "Al cargar las imágenes de la cosecha de Malbec, el sistema se queda procesando y nunca termina de guardar el formulario.", estado: "reportada", fechaInicio: "2026-06-19T08:42", fechaFin: null },
  { id: "INC-8H7F", titulo: "El calendario no muestra la disponibilidad correcta", usuario: "Martín Quiroga", desc: "En la actividad de poda figuran cupos libres para el 20/06, pero al intentar reservar dice que ya está completo.", estado: "reportada", fechaInicio: "2026-06-18T17:05", fechaFin: null },
  { id: "INC-7C18", titulo: "No me llega el mail de confirmación de reserva", usuario: "Camila Ríos", desc: "Reservé la degustación en Finca La Escondida y nunca recibí el correo con el voucher, aunque figura confirmada.", estado: "revision", fechaInicio: "2026-06-18T11:28", fechaFin: null },
  { id: "INC-6A90", titulo: "Error al editar el cronograma de cultivos", usuario: "Diego Ferreyra", desc: "Cuando guardo cambios en el cronograma de la vid, aparece un mensaje rojo y se pierde todo lo cargado.", estado: "revision", fechaInicio: "2026-06-17T09:50", fechaFin: null },
  { id: "INC-5B57", titulo: "La búsqueda por mapa no carga en el celular", usuario: "Sofía Iglesias", desc: "Desde el teléfono, la pantalla de explorar por mapa queda en blanco y no aparecen las fincas cercanas.", estado: "reportada", fechaInicio: "2026-06-16T19:14", fechaFin: null },
  { id: "INC-4D02", titulo: "No puedo cambiar la foto de perfil del establecimiento", usuario: "Valeria Ponce", desc: "Subo una imagen nueva del logo de la bodega y al guardar vuelve a aparecer la anterior.", estado: "reportada", fechaInicio: "2026-06-15T14:30", fechaFin: null },
  { id: "INC-3F44", titulo: "El chat no envía los mensajes con archivos adjuntos", usuario: "Ignacio Sosa", desc: "Cuando intento mandar un PDF con el itinerario al visitante, el mensaje queda en gris y nunca se envía.", estado: "revision", fechaInicio: "2026-06-14T10:12", fechaFin: null },
  { id: "INC-2E91", titulo: "Los reembolsos no descuentan del total mostrado", usuario: "Renata Vidal", desc: "Aprobé un reembolso de una reserva cancelada pero el panel de ingresos sigue mostrando el monto sin descontar.", estado: "reportada", fechaInicio: "2026-06-13T16:48", fechaFin: null },
  { id: "INC-1A33", titulo: "No me deja invitar a un productor por correo", usuario: "Camila Reyes", desc: "Al cargar el mail del productor para invitarlo a gestionar la finca, el botón Enviar queda deshabilitado.", estado: "revision", fechaInicio: "2026-06-12T13:05", fechaFin: null },
  { id: "INC-0B77", titulo: "El filtro de reservas por fecha muestra resultados de otro mes", usuario: "Lucas Bravo", desc: "Filtro las reservas del 10 al 15 de junio y aparecen también las de mayo mezcladas en el listado.", estado: "reportada", fechaInicio: "2026-06-11T09:22", fechaFin: null },
  { id: "INC-Z4C2", titulo: "Se duplican las notificaciones de nueva reserva", usuario: "Martín Quiroga", desc: "Por cada reserva confirmada recibo dos o tres notificaciones idénticas en la campana del panel.", estado: "resuelta", fechaInicio: "2026-06-08T08:00", fechaFin: "2026-06-10T15:30", motivo: "Se corrigió la suscripción duplicada al canal de notificaciones." },
  { id: "INC-Y8E5", titulo: "El precio de la actividad no acepta decimales", usuario: "Lucía Funes", desc: "Quiero cargar $ 12.500,50 como precio de la degustación y el campo solo me deja números enteros.", estado: "resuelta", fechaInicio: "2026-06-06T11:40", fechaFin: "2026-06-09T10:05", motivo: "Se habilitó la carga de decimales en el campo de precio." },
  { id: "INC-X1F8", titulo: "La estadística de ingresos aparece en cero", usuario: "Diego Ferreyra", desc: "Desde ayer el tablero de estadísticas muestra $ 0 en ingresos del mes a pesar de tener reservas confirmadas.", estado: "desestimada", fechaInicio: "2026-06-04T19:14", fechaFin: "2026-06-05T12:18", motivo: "No se pudo reproducir; era un problema de caché del navegador del usuario." },
  { id: "INC-W6A1", titulo: "No encuentro el botón para reprogramar una actividad", usuario: "Sofía Iglesias", desc: "Necesito mover la cosecha del 12 al 14 de junio pero no veo la opción de reprogramar en el detalle.", estado: "desestimada", fechaInicio: "2026-05-30T07:50", fechaFin: "2026-06-01T09:42", motivo: "La función existe en el detalle de la actividad; se orientó al usuario por soporte." },
];
