import { getActividad } from "@/data/actividades-prod";
import type { CalendarioActividad, DiaCelda, MesCal, MetricasCal } from "@/types/calendario";
import type { DiaHora } from "@/types/calendario";

export const MESES_LABEL = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

export const NOMBRES_DIA = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

const NOMBRE_DOW = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

const DOW_BY_LABEL: Record<string, number> = {
  Domingo: 0, Lunes: 1, Martes: 2, Miércoles: 3, Jueves: 4, Viernes: 5, Sábado: 6,
};

/** "Hoy" simulado dentro del mes en curso. */
const HOY = { year: 2026, month: 2, day: 16 };

const CUPO_MAX_DEFAULT = 10;

/** Carga de reservas por día del mes (pagadas / pendientes) — marzo. */
const CARGA_MARZO: Record<number, { pagadas: number; pendientes: number }> = {
  2: { pagadas: 8, pendientes: 0 }, 4: { pagadas: 10, pendientes: 0 }, 6: { pagadas: 6, pendientes: 0 },
  9: { pagadas: 9, pendientes: 0 }, 11: { pagadas: 7, pendientes: 0 }, 13: { pagadas: 10, pendientes: 0 },
  16: { pagadas: 6, pendientes: 3 }, 18: { pagadas: 3, pendientes: 2 }, 20: { pagadas: 7, pendientes: 3 },
  23: { pagadas: 1, pendientes: 1 }, 25: { pagadas: 0, pendientes: 0 }, 27: { pagadas: 8, pendientes: 2 },
  30: { pagadas: 2, pendientes: 2 },
};

const CARGA_ABRIL: Record<number, { pagadas: number; pendientes: number }> = {
  1: { pagadas: 2, pendientes: 2 }, 3: { pagadas: 1, pendientes: 1 }, 6: { pagadas: 3, pendientes: 3 },
  8: { pagadas: 0, pendientes: 0 }, 10: { pagadas: 4, pendientes: 2 }, 13: { pagadas: 1, pendientes: 1 },
  15: { pagadas: 5, pendientes: 2 }, 17: { pagadas: 2, pendientes: 1 }, 20: { pagadas: 3, pendientes: 2 },
};

function esPasado(year: number, month: number, d: number): boolean {
  return year < HOY.year || (year === HOY.year && month < HOY.month) || (year === HOY.year && month === HOY.month && d < HOY.day);
}

function construirMes(
  year: number, month: number, carga: Record<number, { pagadas: number; pendientes: number }>,
  cupoMax: number, dowDisponible: number[], horarioDow: Record<number, { desde: string; hasta: string }>,
): MesCal {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days: Record<number, DiaCelda> = {};
  for (let d = 1; d <= daysInMonth; d++) {
    const dow = new Date(year, month, d).getDay();
    const disponible = dowDisponible.includes(dow);
    const reg = carga[d];
    const pagadas = disponible && reg ? reg.pagadas : 0;
    const pasado = esPasado(year, month, d);
    const pendientes = disponible && reg && !pasado ? reg.pendientes : 0;
    const ocupados = pagadas + pendientes;
    days[d] = {
      dia: d, dow, disponible, cupoMax, pagadas, pendientes, ocupados,
      libres: Math.max(0, cupoMax - ocupados),
      lleno: disponible && ocupados >= cupoMax,
      pasado,
      horario: horarioDow[dow] || null,
    };
  }
  return { year, month, daysInMonth, days };
}

function calcularMetricas(mes: MesCal): MetricasCal {
  let pagadas = 0, pendientes = 0, finalizadas = 0;
  Object.values(mes.days).forEach((c) => {
    if (!c.disponible) return;
    if (c.pasado) finalizadas += c.pagadas;
    else { pagadas += c.pagadas; pendientes += c.pendientes; }
  });
  return { pagadas, pendientes, finalizadas };
}

export function fechaLarga(year: number, month: number, day: number): string {
  const dow = new Date(year, month, day).getDay();
  return `${NOMBRE_DOW[dow]} ${String(day).padStart(2, "0")}/${String(month + 1).padStart(2, "0")}/${year}`;
}

/** Construye el calendario de disponibilidad de una actividad (mock). */
export function buildCalendario(id: string): CalendarioActividad | null {
  const act = getActividad(id);
  if (!act) return null;

  const dias: DiaHora[] = act.dias.map((d) => ({ dia: d.dia, desde: d.desde, hasta: d.hasta }));
  const dowDisponible = dias.map((d) => DOW_BY_LABEL[d.dia]).filter((n) => n !== undefined);
  const horarioDow: Record<number, { desde: string; hasta: string }> = {};
  dias.forEach((d) => { const dow = DOW_BY_LABEL[d.dia]; if (dow !== undefined) horarioDow[dow] = { desde: d.desde, hasta: d.hasta }; });

  const cupoMax = CUPO_MAX_DEFAULT;
  const meses = [
    construirMes(2026, 2, CARGA_MARZO, cupoMax, dowDisponible, horarioDow),
    construirMes(2026, 3, CARGA_ABRIL, cupoMax, dowDisponible, horarioDow),
  ];

  return { meses, metricas: calcularMetricas(meses[0]), dias, cupoMax };
}
