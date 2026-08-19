/**
 * Degradés de la miniatura de cultivo. El catálogo del backend no manda color,
 * así que se elige uno de forma estable a partir del nombre.
 *
 * Del nombre y no del id a propósito: el id es opaco, y un cultivo recreado
 * cambiaría de color sin motivo visible. Con el nombre, "Uva Malbec" tiene
 * siempre la misma miniatura. La contra asumida es que renombrarlo la cambia.
 */
const GRADIENTES = [
  "linear-gradient(135deg,#6B2B4A,#3A1226)",
  "linear-gradient(135deg,#7C8A4A,#3D4A1E)",
  "linear-gradient(135deg,#C98A3C,#7A4A15)",
  "linear-gradient(135deg,#4A6B8A,#1E3A4A)",
  "linear-gradient(135deg,#8A5A3C,#4A2A15)",
  "linear-gradient(135deg,#5A8A6B,#1E4A32)",
];

/** trim + minúsculas + sin acentos, para que el color no dependa de cómo se tipeó. */
function normalizar(v: string): string {
  return v
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

export function gradienteDe(nombre: string): string {
  const t = normalizar(nombre);
  // FNV-1a: barato y con buena dispersión para cadenas cortas.
  let h = 0x811c9dc5;
  for (let i = 0; i < t.length; i++) {
    h ^= t.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return GRADIENTES[Math.abs(h) % GRADIENTES.length];
}
