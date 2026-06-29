let seq = 0;

/** Genera un id único dentro de la sesión (mock, hasta tener ids del backend). */
export function genId(prefix: string): string {
  seq += 1;
  return `${prefix}-${seq}`;
}
