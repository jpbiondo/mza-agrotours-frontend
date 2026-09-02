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
