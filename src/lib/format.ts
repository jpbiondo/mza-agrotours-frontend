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
