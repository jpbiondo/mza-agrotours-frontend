import type { EstadoReservaProd, ParticipanteProd, ReservaProd } from "@/types/panel-reservas";

export type ProdTone = "warning" | "info" | "neutral" | "danger" | "success";

export const ESTADO_META: Record<EstadoReservaProd, { label: string; tone: ProdTone; icon: string }> = {
  pendiente: { label: "Pendiente", tone: "warning", icon: "clock" },
  pagada: { label: "Pagada", tone: "info", icon: "credit-card" },
  cancelada_reembolso: { label: "Cancelada c/reembolso", tone: "neutral", icon: "rotate-ccw" },
  cancelada_sin: { label: "Cancelada s/reembolso", tone: "danger", icon: "x-circle" },
  finalizada: { label: "Finalizada", tone: "success", icon: "check-circle-2" },
};

export const ESTADO_OPTS: { value: "todos" | EstadoReservaProd; label: string }[] = [
  { value: "todos", label: "Todas" },
  { value: "pendiente", label: "Pendientes" },
  { value: "pagada", label: "Pagadas" },
  { value: "finalizada", label: "Finalizadas" },
  { value: "cancelada_reembolso", label: "Canceladas c/reembolso" },
  { value: "cancelada_sin", label: "Canceladas s/reembolso" },
];

export function categoriaEtaria(edad: number): "Infante" | "Menor" | "Adulto" {
  if (edad <= 2) return "Infante";
  if (edad < 18) return "Menor";
  return "Adulto";
}

/** Precio por categoría: infante sin cargo, menor 50 %, adulto 100 %. */
export function precioCategoria(edad: number, base: number): number {
  if (edad <= 2) return 0;
  if (edad < 18) return Math.round(base * 0.5);
  return base;
}

export function totalReserva(r: ReservaProd): number {
  return r.participantes.reduce((s, p) => s + precioCategoria(p.edad, r.precioAdulto), 0);
}

/** Resumen de rango etario, en orden Adulto → Menor → Infante. */
export function rangoEtario(participantes: ParticipanteProd[]): { cat: string; n: number }[] {
  const orden = ["Adulto", "Menor", "Infante"];
  const cuenta: Record<string, number> = {};
  participantes.forEach((p) => {
    const c = categoriaEtaria(p.edad);
    cuenta[c] = (cuenta[c] || 0) + 1;
  });
  return orden.filter((c) => cuenta[c]).map((c) => ({ cat: c, n: cuenta[c] }));
}

/** Reservas recibidas por el establecimiento (mock). */
export const RESERVAS_RECIBIDAS: ReservaProd[] = [
  { id: "RES-2K9F", actId: "ACT-7K2M", actividad: "Cosecha de Malbec al amanecer", fecha: "2026-03-25", fechaLabel: "25/03/2026", horario: "06:30 — 10:00", contacto: "Mariana Robledo", estado: "pendiente", precioAdulto: 12500,
    participantes: [{ nombre: "Mariana Robledo", edad: 34 }, { nombre: "Diego Robledo", edad: 37 }] },
  { id: "RES-4D6T", actId: "ACT-7K2M", actividad: "Cosecha de Malbec al amanecer", fecha: "2026-03-25", fechaLabel: "25/03/2026", horario: "06:30 — 10:00", contacto: "Gabriela Méndez", estado: "pagada", precioAdulto: 12500,
    participantes: [{ nombre: "Gabriela Méndez", edad: 45 }, { nombre: "Esteban Méndez", edad: 47 }, { nombre: "Joaquín Méndez", edad: 14 }, { nombre: "Camila Méndez", edad: 2 }] },
  { id: "RES-1A8C", actId: "ACT-9C1R", actividad: "Degustación guiada de varietales", fecha: "2026-04-12", fechaLabel: "12/04/2026", horario: "17:00 — 19:00", contacto: "Valeria Sosa", estado: "pendiente", precioAdulto: 9800,
    participantes: [{ nombre: "Valeria Sosa", edad: 38 }, { nombre: "Nicolás Sosa", edad: 40 }, { nombre: "Tomás Sosa", edad: 9 }] },
  { id: "RES-8N4D", actId: "ACT-9C1R", actividad: "Degustación guiada de varietales", fecha: "2026-04-12", fechaLabel: "12/04/2026", horario: "17:00 — 19:00", contacto: "Inés Cabrera", estado: "pagada", precioAdulto: 9800,
    participantes: [{ nombre: "Inés Cabrera", edad: 67 }, { nombre: "Hugo Belmonte", edad: 70 }] },
  { id: "RES-3F8P", actId: "ACT-3F8P", actividad: "Poda y cuidado del viñedo", fecha: "2026-07-19", fechaLabel: "19/07/2026", horario: "09:00 — 11:00", contacto: "Ramiro Quevedo", estado: "pendiente", precioAdulto: 8200,
    participantes: [{ nombre: "Ramiro Quevedo", edad: 28 }] },
  { id: "RES-7B2L", actId: "ACT-7K2M", actividad: "Cosecha de Malbec al amanecer", fecha: "2026-02-14", fechaLabel: "14/02/2026", horario: "06:30 — 10:00", contacto: "Carolina Vega", estado: "finalizada", precioAdulto: 12500,
    participantes: [{ nombre: "Carolina Vega", edad: 41 }, { nombre: "Federico Vega", edad: 43 }, { nombre: "Lucas Andrade", edad: 29 }] },
  { id: "RES-5M1G", actId: "ACT-9C1R", actividad: "Degustación guiada de varietales", fecha: "2026-01-22", fechaLabel: "22/01/2026", horario: "17:00 — 19:00", contacto: "Florencia Brizuela", estado: "finalizada", precioAdulto: 9800,
    participantes: [{ nombre: "Florencia Brizuela", edad: 52 }, { nombre: "Andrés Brizuela", edad: 55 }] },
  { id: "RES-9X3P", actId: "ACT-3F8P", actividad: "Poda y cuidado del viñedo", fecha: "2026-02-09", fechaLabel: "09/02/2026", horario: "09:00 — 11:00", contacto: "Paula Iriarte", estado: "cancelada_reembolso", precioAdulto: 8200,
    participantes: [{ nombre: "Paula Iriarte", edad: 33 }, { nombre: "Sebastián Iriarte", edad: 35 }] },
  { id: "RES-6P2W", actId: "ACT-7K2M", actividad: "Cosecha de Malbec al amanecer", fecha: "2026-03-25", fechaLabel: "25/03/2026", horario: "06:30 — 10:00", contacto: "Lucas Andrade", estado: "cancelada_sin", precioAdulto: 12500,
    participantes: [{ nombre: "Lucas Andrade", edad: 31 }, { nombre: "Sofía Lamadrid", edad: 30 }, { nombre: "Pedro Aliaga", edad: 36 }] },
  { id: "RES-0J5K", actId: "ACT-9C1R", actividad: "Degustación guiada de varietales", fecha: "2026-04-12", fechaLabel: "12/04/2026", horario: "17:00 — 19:00", contacto: "Martín Olguín", estado: "pagada", precioAdulto: 9800,
    participantes: [{ nombre: "Martín Olguín", edad: 49 }, { nombre: "Rocío Ferreyra", edad: 26 }] },
  { id: "RES-4F8M", actId: "ACT-3F8P", actividad: "Poda y cuidado del viñedo", fecha: "2026-07-19", fechaLabel: "19/07/2026", horario: "09:00 — 11:00", contacto: "Tomás Echeverría", estado: "pendiente", precioAdulto: 8200,
    participantes: [{ nombre: "Tomás Echeverría", edad: 39 }, { nombre: "Julia Echeverría", edad: 1 }] },
  { id: "RES-2Q9R", actId: "ACT-7K2M", actividad: "Cosecha de Malbec al amanecer", fecha: "2026-01-31", fechaLabel: "31/01/2026", horario: "06:30 — 10:00", contacto: "Camila Ríos", estado: "finalizada", precioAdulto: 12500,
    participantes: [{ nombre: "Camila Ríos", edad: 24 }, { nombre: "Bruno Ríos", edad: 27 }, { nombre: "Lourdes Ríos", edad: 62 }] },
];
