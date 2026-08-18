import type { DashboardData, Finca } from "@/types/panel";

/** Establecimientos que administra el productor logueado. */
export const FINCAS: Finca[] = [
  { id: "escondida", nombre: "Finca La Escondida", location: "Luján de Cuyo, Mendoza", role: "Propietaria", pend: 3 },
  { id: "alamos", nombre: "Finca Los Álamos", location: "Maipú, Mendoza", role: "Productora", pend: 0 },
  { id: "vientosur", nombre: "Bodega Viento Sur", location: "Valle de Uco, Tunuyán", role: "Productora", pend: 1 },
];

/** Dashboard del productor para la finca activa (mock). */
export const DASHBOARD: DashboardData = {
  saludoNombre: "Lucía",
  fincaNombre: "Finca La Escondida",
  stats: [
    { icon: "calendar-check", label: "Reservas del mes", value: "38", delta: "+12% vs. febrero", tone: "success" },
    { icon: "users", label: "Ocupación media", value: "74%", delta: "+5 pts", tone: "success" },
    { icon: "grape", label: "Experiencias activas", value: "6", delta: "2 en borrador", tone: "neutral" },
    { icon: "banknote", label: "Ingresos del mes", value: "$ 412.500", delta: "+18% vs. febrero", tone: "success" },
  ],
  reservas: [
    { codigo: "RES-2K9F", experiencia: "Cosecha de Malbec", fecha: "25/03/2026", cupos: "4 / 12", estado: "Confirmada", tone: "success" },
    { codigo: "RES-7H1B", experiencia: "Poda de viñedos", fecha: "02/04/2026", cupos: "8 / 8", estado: "Lista de espera", tone: "warning" },
    { codigo: "RES-4M3X", experiencia: "Degustación guiada", fecha: "09/04/2026", cupos: "2 / 10", estado: "Disponible", tone: "info" },
  ],
  cultivos: [
    { nombre: "Malbec", finca: "Cuartel 3", state: "harvest", label: "En cosecha" },
    { nombre: "Cabernet Sauvignon", finca: "Cuartel 5", state: "growing", label: "En crecimiento" },
    { nombre: "Olivos Arbequina", finca: "Lote Norte", state: "rest", label: "Descanso" },
    { nombre: "Duraznos", finca: "Lote Sur", state: "growing", label: "En crecimiento" },
  ],
};
