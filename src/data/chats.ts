import type { EstChat, VisitorChat } from "@/types/chats";

/** Gradientes cálidos para el avatar de actividad. */
export const CHAT_GRADS = [
  "linear-gradient(135deg,#7FA876,#2D5A27)",
  "linear-gradient(135deg,#C9A227,#805533)",
  "linear-gradient(135deg,#A6794F,#5C3B22)",
  "linear-gradient(135deg,#6F9E64,#1E5418)",
  "linear-gradient(135deg,#D99A4E,#A6794F)",
  "linear-gradient(135deg,#B86B4F,#5C3B22)",
];

export const CHAT_ERROR_NAMES = ["TIMEOUT_RED", "ERR_503_SERVICIO", "ERR_NO_CONEXION"];
export const URL_INCIDENCIAS = "soporte.agrotours.mza/incidencias";

/* ---- Bandeja del establecimiento (lado productor) ---------------------- */
export const EST_CHATS: EstChat[] = [
  {
    id: "RES-2K9F", visitor: { name: "Sofía Iglesias", initials: "SI" }, activity: { title: "Cosecha de Malbec al amanecer", date: "18/06/2026", seed: 0 }, reservaCode: "RES-2K9F", personas: 2, unread: 2, lastTime: "10:42", lastFrom: "visitor", lastText: "¿Puedo sumar un acompañante a la reserva?",
    days: [
      { label: "Ayer", date: "17/06/2026", messages: [
        { id: "a1", from: "visitor", text: "Hola Lucía! Reservamos para la cosecha del 18/06. Quería saber a qué hora arranca exactamente.", time: "18:20" },
        { id: "a2", from: "productor", text: "Hola Sofía! ¿Cómo estás? Arrancamos 07:00 en punto en la tranquera de la finca. Te recomiendo llegar 15 minutos antes.", time: "19:06" },
        { id: "a3", from: "visitor", text: "Perfecto. ¿Hace falta llevar algo en particular?", time: "19:32" },
        { id: "a4", from: "productor", text: "Traé abrigo y calzado cómodo, a esa hora hace fresco. El desayuno de campo lo ponemos nosotros.", time: "19:40" },
      ] },
      { label: "Hoy", date: "18/06/2026", messages: [
        { id: "b1", from: "visitor", text: "¡Buenísimo! Una última cosa.", time: "10:41" },
        { id: "b2", from: "visitor", text: "¿Puedo sumar un acompañante a la reserva?", time: "10:42" },
      ] },
    ],
  },
  {
    id: "RES-7B2L", visitor: { name: "Lucas Bravo", initials: "LB" }, activity: { title: "Visita familiar entre viñedos", date: "21/06/2026", seed: 3 }, reservaCode: "RES-7B2L", personas: 4, unread: 1, lastTime: "09:15", lastFrom: "visitor", lastText: "¿La actividad es apta para chicos de 6 años?",
    days: [
      { label: "Hoy", date: "18/06/2026", messages: [
        { id: "c1", from: "visitor", text: "Hola! Estamos viendo la visita familiar del 21/06 para 4 personas.", time: "09:10" },
        { id: "c2", from: "visitor", text: "¿La actividad es apta para chicos de 6 años?", time: "09:15" },
      ] },
    ],
  },
  {
    id: "RES-4M1T", visitor: { name: "Martín Quiroga", initials: "MQ" }, activity: { title: "Visita guiada y picada de campo", date: "20/06/2026", seed: 1 }, reservaCode: "RES-4M1T", personas: 3, unread: 0, lastTime: "Ayer", lastFrom: "productor", lastText: "Listo Martín, dejé anotada la opción sin TACC para los tres cubiertos.",
    days: [
      { label: "16/06/2026", date: "16/06/2026", messages: [
        { id: "d1", from: "visitor", text: "Hola, reservamos la visita guiada del sábado. ¿Tienen opción sin TACC para la picada?", time: "12:02" },
        { id: "d2", from: "productor", text: "¡Hola Martín! Sí, tenemos. ¿Para cuántos de los tres cubiertos lo necesitás?", time: "14:48" },
        { id: "d3", from: "visitor", text: "Para los tres, gracias!", time: "17:30" },
      ] },
      { label: "Ayer", date: "17/06/2026", messages: [
        { id: "e1", from: "productor", text: "Listo Martín, dejé anotada la opción sin TACC para los tres cubiertos.", time: "11:05" },
      ] },
    ],
  },
  {
    id: "RES-9C3K", visitor: { name: "Renata Vidal", initials: "RV" }, activity: { title: "Poda en verde participativa", date: "24/06/2026", seed: 2 }, reservaCode: "RES-9C3K", personas: 1, unread: 0, lastTime: "16/06", lastFrom: "visitor", lastText: "Buenísimo, muchas gracias por la info!",
    days: [
      { label: "16/06/2026", date: "16/06/2026", messages: [
        { id: "f1", from: "visitor", text: "Hola Lucía, ¿la poda en verde del 24 se suspende si llueve?", time: "08:10" },
        { id: "f2", from: "productor", text: "Hola Renata! Si hay lluvia fuerte la reprogramamos sin costo y te avisamos el día anterior.", time: "09:24" },
        { id: "f3", from: "visitor", text: "Buenísimo, muchas gracias por la info!", time: "10:01" },
      ] },
    ],
  },
  {
    id: "RES-1A8C", visitor: { name: "Valeria Ponce", initials: "VP" }, activity: { title: "Degustación de varietales en bodega", date: "15/06/2026", seed: 4 }, reservaCode: "RES-1A8C", personas: 2, unread: 0, lastTime: "14/06", lastFrom: "productor", lastText: "¡Gracias a vos! Las esperamos el sábado.",
    days: [
      { label: "14/06/2026", date: "14/06/2026", messages: [
        { id: "g1", from: "visitor", text: "Hola! ¿La degustación incluye traslado desde el centro de Maipú?", time: "11:20" },
        { id: "g2", from: "productor", text: "Hola Valeria! El traslado no está incluido, pero te puedo pasar un remís de confianza si querés.", time: "13:02" },
        { id: "g3", from: "visitor", text: "No hace falta, vamos en auto. ¡Gracias!", time: "13:40" },
        { id: "g4", from: "productor", text: "¡Gracias a vos! Las esperamos el sábado.", time: "13:45" },
      ] },
    ],
  },
];

/* ---- Chats del visitante ---------------------------------------------- */
export const VISITOR_CHATS: VisitorChat[] = [
  {
    id: "CHAT-2K9F", activity: { id: "ACT-MALBEC-25", title: "Cosecha de Malbec al amanecer", finca: "Finca La Escondida", loc: "Maipú, Mendoza", seed: 0 }, unread: 2, lastTime: "10:42", lastFrom: "productor", lastText: "Sí, podés sumar a un acompañante sin problema. Avisanos el día anterior.",
    days: [
      { label: "Ayer", date: "31/05/2026", messages: [
        { id: "m1", from: "visitor", text: "Hola! Quería consultar si para la cosecha del 25/03 puedo llevar a un acompañante.", time: "18:20" },
        { id: "m2", from: "productor", text: "Hola Camila! ¿Cómo estás?", time: "19:05" },
        { id: "m3", from: "productor", text: "Sí, podés sumar a un acompañante sin problema. Sólo avisanos el día anterior así contamos con el desayuno.", time: "19:06" },
      ] },
      { label: "Hoy", date: "01/06/2026", messages: [
        { id: "m4", from: "visitor", text: "Perfecto, muchas gracias!", time: "09:15" },
        { id: "m5", from: "productor", text: "¡A vos! Cualquier otra duda, escribinos por acá. Te recomiendo traer abrigo, a esa hora hace fresco.", time: "10:42" },
      ] },
    ],
  },
  {
    id: "CHAT-7B2L", activity: { id: "ACT-DEG-12", title: "Degustación guiada de varietales", finca: "Bodega Los Álamos", loc: "Luján de Cuyo, Mendoza", seed: 1 }, unread: 0, lastTime: "Ayer", lastFrom: "visitor", lastText: "Buenísimo, llevamos el voucher impreso entonces.",
    days: [
      { label: "30/05/2026", date: "30/05/2026", messages: [
        { id: "n1", from: "visitor", text: "Hola! Reservamos para 4 personas el 12/04, ¿hace falta llevar el voucher impreso?", time: "11:02" },
        { id: "n2", from: "productor", text: "Hola Camila! Con el código de reserva alcanza, pero si lo querés traer impreso mejor.", time: "14:48" },
        { id: "n3", from: "visitor", text: "Buenísimo, llevamos el voucher impreso entonces.", time: "17:30" },
      ] },
    ],
  },
  {
    id: "CHAT-1A8C", activity: { id: "ACT-OLIVA-08", title: "Recorrido en finca de olivos", finca: "Lote Norte", loc: "Junín, Mendoza", seed: 2 }, unread: 1, lastTime: "26/05", lastFrom: "productor", lastText: "¡Hola! Te paso los horarios disponibles para mayo.",
    days: [
      { label: "26/05/2026", date: "26/05/2026", messages: [
        { id: "o1", from: "visitor", text: "Hola! ¿Qué horarios tienen disponibles en mayo?", time: "08:10" },
        { id: "o2", from: "productor", text: "¡Hola! Te paso los horarios disponibles para mayo: sábados de 10 a 12:30 y domingos de 15 a 17:30.", time: "09:24" },
      ] },
    ],
  },
];

/** Hora actual como HH:MM. */
export function chatNow(): string {
  const n = new Date();
  return `${String(n.getHours()).padStart(2, "0")}:${String(n.getMinutes()).padStart(2, "0")}`;
}
