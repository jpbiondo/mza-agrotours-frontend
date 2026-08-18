import type { RangoEtario, Run } from "@/types/rangos";

/** Edades admitidas: de 0 a 120 años, ambas inclusive. */
export const RE_MIN_AGE = 0;
export const RE_MAX_AGE = 120;

/** Solo letras y espacios. */
export const RE_NOMBRE_RE = /^[A-Za-zÁÉÍÓÚáéíóúÑñÜü ]+$/;

/* Semilla: deja 1–2 años sin cubrir (hueco) y solapa 60–64. El último está de baja. */
export const RANGO_SEED: RangoEtario[] = [
  { id: "r1", nombre: "Niños", min: 3, max: 11, baja: null },
  { id: "r2", nombre: "Adolescentes", min: 12, max: 17, baja: null },
  { id: "r3", nombre: "Adultos", min: 18, max: 64, baja: null },
  { id: "r4", nombre: "Adultos mayores", min: 60, max: 99, baja: null },
  { id: "r5", nombre: "Tarifa promocional", min: 6, max: 10, baja: "08/05/2026 · 10:15" },
];

/* ---- Análisis de cobertura (solo rangos activos) ----------------------- */
function reGroupRuns(ages: number[]): Run[] {
  const runs: Run[] = [];
  for (const a of ages) {
    const last = runs[runs.length - 1];
    if (last && a === last.to + 1) last.to = a;
    else runs.push({ from: a, to: a });
  }
  return runs;
}

export function reFmtRun(r: Run): string {
  return r.from === r.to ? `${r.from} año${r.from === 1 ? "" : "s"}` : `${r.from} a ${r.to} años`;
}

export function reAnalyze(ranges: RangoEtario[]): { gaps: Run[]; overlaps: Run[] } {
  const active = ranges.filter((r) => !r.baja);
  if (!active.length) return { gaps: [], overlaps: [] };
  const maxAge = Math.max(...active.map((r) => r.max));
  const count: Record<number, number> = {};
  for (let a = RE_MIN_AGE; a <= maxAge; a++) count[a] = 0;
  active.forEach((r) => { for (let a = Math.max(RE_MIN_AGE, r.min); a <= r.max; a++) count[a]++; });
  const gapAges: number[] = [], overlapAges: number[] = [];
  for (let a = RE_MIN_AGE; a <= maxAge; a++) {
    if (count[a] === 0) gapAges.push(a);
    else if (count[a] >= 2) overlapAges.push(a);
  }
  return { gaps: reGroupRuns(gapAges), overlaps: reGroupRuns(overlapAges) };
}
