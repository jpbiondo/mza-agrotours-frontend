import type { ActividadPerf, Estadisticas, Periodo, PeriodoMeta } from "@/types/estadisticas";

const KPIS_BY_PERIOD: Estadisticas["kpisByPeriod"] = {
  "30d": { ocupacionPct: 72, ocupacionFilled: 86, ocupacionTotal: 120, beneficios: 3850, beneficiosDelta: 8, cancelacionPct: 3, cancelacionCount: 3 },
  "6m": { ocupacionPct: 75, ocupacionFilled: 300, ocupacionTotal: 400, beneficios: 12000, beneficiosDelta: 15, cancelacionPct: 4, cancelacionCount: 16 },
  "12m": { ocupacionPct: 68, ocupacionFilled: 612, ocupacionTotal: 900, beneficios: 28400, beneficiosDelta: 22, cancelacionPct: 5, cancelacionCount: 41 },
};

const SERIES_BY_PERIOD: Estadisticas["seriesByPeriod"] = {
  "30d": {
    title: "Reservas semanales", sub: "Últimos 30 días, por semana",
    bars: [
      { label: "Sem 1", value: 18, ganancia: 740 }, { label: "Sem 2", value: 24, ganancia: 1060 },
      { label: "Sem 3", value: 21, ganancia: 920 }, { label: "Sem 4", value: 23, ganancia: 1130 },
    ],
  },
  "6m": {
    title: "Reservas totales mensuales", sub: "Últimos 6 meses",
    bars: [
      { label: "Ene", value: 42, ganancia: 1680 }, { label: "Feb", value: 51, ganancia: 2040 },
      { label: "Mar", value: 78, ganancia: 3120 }, { label: "Abr", value: 38, ganancia: 1520 },
      { label: "May", value: 56, ganancia: 2240 }, { label: "Jun", value: 95, ganancia: 3800 },
    ],
  },
  "12m": {
    title: "Reservas totales mensuales", sub: "Este año, enero a diciembre",
    bars: [
      { label: "Ene", value: 42, ganancia: 1680 }, { label: "Feb", value: 51, ganancia: 2040 },
      { label: "Mar", value: 78, ganancia: 3120 }, { label: "Abr", value: 38, ganancia: 1520 },
      { label: "May", value: 56, ganancia: 2240 }, { label: "Jun", value: 95, ganancia: 3800 },
      { label: "Jul", value: 62, ganancia: 2480 }, { label: "Ago", value: 44, ganancia: 1760 },
      { label: "Sep", value: 71, ganancia: 2840 }, { label: "Oct", value: 88, ganancia: 3520 },
      { label: "Nov", value: 102, ganancia: 4080 }, { label: "Dic", value: 134, ganancia: 5360 },
    ],
  },
};

const ACTIVIDADES_PERF: ActividadPerf[] = [
  { id: "vendimia-malbec", nombre: "Vendimia nocturna de Malbec", cultivo: "Uva Malbec", cupos: 200, reservas: 180, ocupacion: 90, ingresos: 9900, color: "#A33A2C", icon: "grape" },
  { id: "cosecha-olivar", nombre: "Cosecha en el olivar familiar", cultivo: "Olivo Arauco", cupos: 200, reservas: 130, ocupacion: 65, ingresos: 6240, color: "#6B7C3A", icon: "sprout" },
  { id: "poda-vinedo", nombre: "Poda de invierno en viñedo", cultivo: "Uva Bonarda", cupos: 200, reservas: 40, ocupacion: 20, ingresos: 1800, color: "#805533", icon: "scissors" },
  { id: "degustacion-quesos", nombre: "Degustación de quesos de cabra", cultivo: "Tambo caprino", cupos: 120, reservas: 110, ocupacion: 92, ingresos: 4950, color: "#C77F2A", icon: "wheat" },
  { id: "paseo-frutales", nombre: "Paseo guiado por los frutales", cultivo: "Duraznos y ciruelas", cupos: 150, reservas: 92, ocupacion: 61, ingresos: 4140, color: "#D67A55", icon: "apple" },
];

export const ESTADISTICAS: Estadisticas = {
  kpisByPeriod: KPIS_BY_PERIOD,
  seriesByPeriod: SERIES_BY_PERIOD,
  actividades: ACTIVIDADES_PERF,
};

export const PERIODOS: PeriodoMeta[] = [
  { value: "30d", label: "Últimos 30 días", sub: "del 03/05 al 02/06", rangoActual: "03/05/2026 – 02/06/2026", rangoAnterior: "03/04/2026 – 02/05/2026" },
  { value: "6m", label: "Últimos 6 meses", sub: "del 02/12/2025 al 02/06/2026", rangoActual: "02/12/2025 – 02/06/2026", rangoAnterior: "02/06/2025 – 01/12/2025" },
  { value: "12m", label: "Este año", sub: "del 01/01 al 31/12 de 2026", rangoActual: "01/01/2026 – 31/12/2026", rangoAnterior: "01/01/2025 – 31/12/2025" },
];

export function periodoMeta(value: Periodo): PeriodoMeta {
  return PERIODOS.find((p) => p.value === value) ?? PERIODOS[1];
}

export function fmtMoney(n: number): string {
  return "$ " + n.toLocaleString("es-AR", { maximumFractionDigits: 0 });
}

export function fmtSignedPct(n: number): string {
  const sign = n > 0 ? "+" : n < 0 ? "−" : "";
  return sign + Math.abs(n).toLocaleString("es-AR", { maximumFractionDigits: 0 }) + "%";
}
