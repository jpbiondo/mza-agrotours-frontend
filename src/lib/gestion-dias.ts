import type { DiaSemana, FechaISO } from "@/types/gestion-dias";

/** De lunes a domingo, que es como se ordena la semana en toda la pantalla. */
export const ORDEN_DIAS: DiaSemana[] = ["LUNES", "MARTES", "MIERCOLES", "JUEVES", "VIERNES", "SABADO", "DOMINGO"];

export const DIA_CORTO: Record<DiaSemana, string> = {
  LUNES: "Lun", MARTES: "Mar", MIERCOLES: "Mié", JUEVES: "Jue", VIERNES: "Vie", SABADO: "Sáb", DOMINGO: "Dom",
};

const MESES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];
const DIAS_LARGOS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

/**
 * "YYYY-MM-DD" → Date local, armada por partes: `new Date(iso)` parsea en UTC y
 * en Argentina devuelve el día anterior.
 */
export function deISO(iso: FechaISO): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function diaSemanaDe(iso: FechaISO): DiaSemana {
  return ORDEN_DIAS[(deISO(iso).getDay() + 6) % 7];
}

export function nombreMes(mes0: number): string {
  return MESES[mes0];
}

/** "Miércoles 4 de junio de 2026". */
export function fechaLarga(iso: FechaISO): string {
  const d = deISO(iso);
  return `${DIAS_LARGOS[d.getDay()]} ${d.getDate()} de ${MESES[d.getMonth()]} de ${d.getFullYear()}`;
}

/** "04/06/2026". */
export function fechaCorta(iso: FechaISO): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

export const SUSPENDIDO_DIAS = "El establecimiento está suspendido: no podés abrir días ni cambiar cupos.";

/** Códigos de dominio de las escrituras de días (`ActividadError` del backend). */
const MENSAJE_ERROR: Record<string, string> = {
  "A.diaHorarioPasado": "El horario de inicio elegido ya pasó.",
  "A.diaFechaOcupada": "Esa fecha ya tiene un día programado. Actualizamos el calendario.",
  "A.loteSinDias": "No hay días para crear: todas las fechas ya tienen un día programado o su horario ya pasó.",
  "A.diaNoModificable": "Ese día ya no admite cambios de cupo: está cancelado o finalizado.",
  "A.diaYaComenzo": "Ese día ya comenzó: no se le puede cambiar el cupo.",
  "A.cupoMenorAReservados": "El cupo no puede quedar por debajo de las personas con reserva vigente. Alguien reservó mientras editabas.",
  "A.rangoFechasInvalido": "La fecha hasta no puede ser anterior a la fecha desde.",
  "A.fechaAnteriorAHoy": "La fecha no puede ser anterior a hoy.",
  "A.fechaFueraDeVentana": "La fecha supera la ventana en la que se pueden abrir días.",
  "A.horarioInvalido": "La hora de fin tiene que ser posterior a la de inicio.",
  "E.suspendido": SUSPENDIDO_DIAS,
};

/** Mensaje para un código de dominio; sin código es un fallo técnico. */
export function mensajeErrorDias(code: string | null | undefined): string {
  return (code && MENSAJE_ERROR[code]) || "No pudimos guardar los cambios. Probá de nuevo en un momento.";
}

/** "JUN" para el bloque de fecha de los diálogos. */
export function mesCorto(iso: FechaISO): string {
  return MESES[deISO(iso).getMonth()].slice(0, 3).toUpperCase();
}
