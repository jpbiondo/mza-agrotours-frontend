import { MESES_LABEL } from "@/data/calendario";
import type { MesCalendario } from "@/types/catalogo";

/**
 * Día de actividad tal como lo mandan `GET /actividades/{id}` y
 * `GET /actividades/{id}/reservar` (`DiaActividadReservaDTO`). Campos
 * opcionales: defensivo.
 */
interface DiaActividadBackend {
  id?: unknown;
  cuposMax?: unknown;
  cuposOcupados?: unknown;
  fechaHoraInicio?: unknown;
}

function aNumero(v: unknown): number {
  return typeof v === "number" && Number.isFinite(v) ? v : 0;
}

/**
 * Agrupa los días de actividad por mes y completa el resto de cada mes como
 * "off", para que la grilla tenga todas las celdas. Los meses salen en orden.
 *
 * `fechaHoraInicio` es un `LocalDateTime` sin zona, así que `new Date()` lo lee
 * como hora local: es lo que se quiere, el día es el del calendario de Mendoza.
 */
export function aCalendario(v: unknown): MesCalendario[] {
  const porMes = new Map<string, MesCalendario>();

  (Array.isArray(v) ? v : []).forEach((raw: unknown) => {
    if (!raw || typeof raw !== "object") return;
    const d = raw as DiaActividadBackend;
    if (typeof d.id !== "string" || d.id === "" || typeof d.fechaHoraInicio !== "string") return;
    const fecha = new Date(d.fechaHoraInicio);
    if (Number.isNaN(fecha.getTime())) return;
    const year = fecha.getFullYear();
    const month = fecha.getMonth();
    const day = fecha.getDate();
    const key = `${year}-${month}`;

    let mes = porMes.get(key);
    if (!mes) {
      mes = { year, month, label: `${MESES_LABEL[month]} ${year}`, days: {} };
      porMes.set(key, mes);
    }

    const cupoMaximo = aNumero(d.cuposMax);
    const cupos = Math.max(0, cupoMaximo - aNumero(d.cuposOcupados));
    mes.days[day] = { id: d.id, state: cupos > 0 ? "disponible" : "off", cupos, cupoMaximo, dow: fecha.getDay() };
  });

  const meses = Array.from(porMes.values()).sort((a, b) => a.year - b.year || a.month - b.month);
  meses.forEach((mes) => {
    const daysInMonth = new Date(mes.year, mes.month + 1, 0).getDate();
    for (let day = 1; day <= daysInMonth; day++) {
      if (!mes.days[day]) {
        mes.days[day] = { id: "", state: "off", cupos: 0, cupoMaximo: 0, dow: new Date(mes.year, mes.month, day).getDay() };
      }
    }
  });
  return meses;
}

/** Posición de un día en el calendario a partir de su id, para preseleccionarlo. */
export function buscarDia(meses: MesCalendario[], id: string): { monthIdx: number; day: number } | null {
  if (!id) return null;
  for (let monthIdx = 0; monthIdx < meses.length; monthIdx++) {
    for (const [day, info] of Object.entries(meses[monthIdx].days)) {
      if (info.id === id) return { monthIdx, day: Number(day) };
    }
  }
  return null;
}

/** Primer mes con algún día reservable; si no hay ninguno, el primero. */
export function primerMesDisponible(meses: MesCalendario[]): number {
  const i = meses.findIndex((m) => Object.values(m.days).some((d) => d.state === "disponible"));
  return Math.max(0, i);
}
