/** Formato de moneda argentino: 12500 → "$ 12.500". */
export function moneyAr(n: number): string {
  return "$ " + Number(n).toLocaleString("es-AR");
}

/** Fecha y hora: ISO → "18/06/2026 · 08:42". */
export function fmtFechaHora(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  const p = (x: number) => String(x).padStart(2, "0");
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} · ${p(d.getHours())}:${p(d.getMinutes())}`;
}

/** Fecha: ISO → "18/06/2026". */
export function fmtFecha(iso: string | null): string {
  if (!iso) return "—";
  // Una fecha sola (los `LocalDate` del backend) la parsea `Date` como UTC, así
  // que al oeste de Greenwich caería un día antes. Se reordena el string.
  const soloFecha = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (soloFecha) return `${soloFecha[3]}/${soloFecha[2]}/${soloFecha[1]}`;
  const d = new Date(iso);
  const p = (x: number) => String(x).padStart(2, "0");
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()}`;
}

const p2 = (x: number) => String(x).padStart(2, "0");

/** Día de un `Date` ya construido en hora local: → "12/10/2026". */
export function fmtDiaLocal(d: Date): string {
  return `${p2(d.getDate())}/${p2(d.getMonth() + 1)}/${d.getFullYear()}`;
}

/** Hora de un `Date` ya construido en hora local: → "09:30". */
export function fmtHoraLocal(d: Date): string {
  return `${p2(d.getHours())}:${p2(d.getMinutes())}`;
}

/** Franja horaria "09:30 — 12:00"; sólo el inicio si falta el fin, `undefined` sin inicio. */
export function fmtFranja(inicio: Date | null, fin: Date | null): string | undefined {
  if (!inicio) return undefined;
  return fin ? `${fmtHoraLocal(inicio)} — ${fmtHoraLocal(fin)}` : fmtHoraLocal(inicio);
}

/**
 * `LocalDateTime` del backend ("2026-10-12T09:30:00", sin offset) como hora
 * local. Se arma a mano en vez de confiar en `Date.parse`, que según el formato
 * exacto puede interpretarlo como UTC y correr la hora.
 */
export function leerFechaLocal(v: unknown): Date | null {
  if (typeof v !== "string") return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?/.exec(v.trim());
  if (!m) return null;
  const [, y, mo, d, h, mi, s] = m;
  return new Date(+y, +mo - 1, +d, +h, +mi, s ? +s : 0);
}

const MESES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

/** Día en palabras: → "20 de marzo de 2026". */
export function fmtDiaLargo(d: Date): string {
  return `${d.getDate()} de ${MESES[d.getMonth()]} de ${d.getFullYear()}`;
}

/**
 * Código corto de una reserva para mostrar: el backend no tiene uno propio,
 * así que se toman los primeros 8 caracteres del UUID → "#3F2A9C1B". Para
 * identificarla sin ambigüedad, poné el UUID completo en el `title`.
 */
export function fmtCodigoReserva(id: string): string {
  return id ? `#${id.slice(0, 8).toUpperCase()}` : "—";
}

/** Promedio de reseñas con un decimal y coma: 4.85 → "4,9". */
export function fmtPuntaje(n: number): string {
  return n.toLocaleString("es-AR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

/** Porcentaje con signo, con el menos tipográfico: 8 → "+8%", -3 → "−3%". */
export function fmtPctConSigno(n: number): string {
  const signo = n > 0 ? "+" : n < 0 ? "−" : "";
  return signo + Math.abs(n).toLocaleString("es-AR", { maximumFractionDigits: 0 }) + "%";
}
