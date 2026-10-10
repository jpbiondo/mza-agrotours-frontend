import type { CultivoRef } from "@/types/datos";

/**
 * Ícono de la tarjeta a partir de los cultivos. El backend no manda ninguno y
 * tampoco tiene por qué: es una decisión de presentación. Se busca por palabra
 * en el nombre y se cae en el brote genérico, que sirve para cualquier cultivo.
 */
export function iconoDeCultivos(cultivos: CultivoRef[]): string {
  const texto = cultivos.map((c) => c.nombre).join(" ").toLowerCase();
  if (/uva|vid|malbec|bonarda|cabernet|torront/.test(texto)) return "grape";
  if (/oliv|aceitun/.test(texto)) return "leaf";
  if (/cereza|durazno|damasco|ciruela|pera|manzana/.test(texto)) return "cherry";
  if (/nog|nuez|nuec/.test(texto)) return "nut";
  if (/vino|bodega/.test(texto)) return "wine";
  if (/recorrido|paseo|rural/.test(texto)) return "map-pin";
  return "sprout";
}

/** Normaliza para búsqueda sin acentos / mayúsculas. */
export function normalizar(s: string): string {
  return (s || "").toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");
}
