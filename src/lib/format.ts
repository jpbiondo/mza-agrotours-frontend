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
  const d = new Date(iso);
  const p = (x: number) => String(x).padStart(2, "0");
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()}`;
}
