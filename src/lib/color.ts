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

/** Índice estable en `[0, n)` a partir del nombre. */
function indiceDe(nombre: string, n: number): number {
  const t = normalizar(nombre);
  // FNV-1a: barato y con buena dispersión para cadenas cortas.
  let h = 0x811c9dc5;
  for (let i = 0; i < t.length; i++) {
    h ^= t.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return Math.abs(h) % n;
}

export function gradienteDe(nombre: string): string {
  return GRADIENTES[indiceDe(nombre, GRADIENTES.length)];
}

/**
 * Colores lisos de la paleta de la tierra (vino, oliva, corteza, ocre,
 * durazno), para el avatar y la barra de una actividad en las estadísticas.
 * Mismo criterio que el degradé: estable por nombre.
 */
const COLORES = ["#A33A2C", "#6B7C3A", "#805533", "#C77F2A", "#D67A55", "#3A6B7A"];

export function colorDe(nombre: string): string {
  return COLORES[indiceDe(nombre, COLORES.length)];
}
