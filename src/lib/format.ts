/** Formato de moneda argentino: 12500 → "$ 12.500". */
export function moneyAr(n: number): string {
  return "$ " + Number(n).toLocaleString("es-AR");
}
