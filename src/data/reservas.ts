import type { EstadoReserva, Reserva } from "@/types/reservas";

export const RESERVAS: Reserva[] = [
  {
    id: "RES-2K9F",
    titulo: "Cosecha de Malbec al amanecer", finca: "Finca La Escondida", loc: "Maipú, Mendoza",
    fecha: "2026-03-25", fechaLabel: "25/03/2026", horario: "06:30 — 10:00",
    personas: 2, precioUnit: 12500, estado: "pendiente", seed: 0, photo: "viñedo al amanecer, racimos de Malbec",
    incluye: ["Tijera de cosecha y guantes", "Desayuno de campo", "Visita guiada por la bodega", "Degustación de 3 varietales"],
    productor: "Lucía Funes", direccion: "Carril Urquiza 1450, Maipú, Mendoza",
    desglose: [{ grupo: "Adultos", cantidad: 2, precio: 12500 }],
    participantes: [{ nombre: "Mariana Robledo", categoria: "Adulto" }, { nombre: "Diego Robledo", categoria: "Adulto" }],
  },
  {
    id: "RES-7B2L",
    titulo: "Degustación guiada de varietales", finca: "Bodega Los Álamos", loc: "Luján de Cuyo, Mendoza",
    fecha: "2026-04-12", fechaLabel: "12/04/2026", horario: "17:00 — 19:00",
    personas: 4, precioUnit: 9800, estado: "pendiente", seed: 1, photo: "copas de vino sobre barrica de roble",
    incluye: ["Cata guiada de 5 varietales", "Tabla de quesos regionales", "Recorrido por la bodega"],
    productor: "Martín Olguín", direccion: "Ruta Provincial 15, km 8, Luján de Cuyo, Mendoza",
    desglose: [{ grupo: "Adultos", cantidad: 3, precio: 9800 }, { grupo: "Jubilados", cantidad: 1, precio: 7840 }],
    participantes: [
      { nombre: "Carolina Vega", categoria: "Adulto" }, { nombre: "Federico Vega", categoria: "Adulto" },
      { nombre: "Lucas Andrade", categoria: "Adulto" }, { nombre: "Hugo Belmonte", categoria: "Jubilado" },
    ],
  },
  {
    id: "RES-1A8C",
    titulo: "Recorrido en finca de olivos", finca: "Lote Norte", loc: "Junín, Mendoza",
    fecha: "2026-02-08", fechaLabel: "08/02/2026", horario: "10:00 — 12:30",
    personas: 3, precioUnit: 7500, estado: "finalizada", seed: 2, photo: "hilera de olivos al atardecer",
    incluye: ["Recorrido por los olivares", "Degustación de aceites", "Botella de regalo"],
    productor: "Sofía Lamadrid", direccion: "Calle Los Olivos 320, Junín, Mendoza",
    desglose: [{ grupo: "Adultos", cantidad: 2, precio: 7500 }, { grupo: "Menores (4–12)", cantidad: 1, precio: 3750 }],
    participantes: [
      { nombre: "Valeria Sosa", categoria: "Adulto" }, { nombre: "Nicolás Sosa", categoria: "Adulto" },
      { nombre: "Tomás Sosa", categoria: "Menor" },
    ],
  },
  {
    id: "RES-4D6T",
    titulo: "Vendimia familiar participativa", finca: "Finca Santa Rosa", loc: "San Rafael, Mendoza",
    fecha: "2026-03-15", fechaLabel: "15/03/2026", horario: "08:00 — 12:00",
    personas: 5, precioUnit: 11000, estado: "finalizada", seed: 3, photo: "manos cosechando uva en cesta",
    incluye: ["Cosecha participativa", "Almuerzo criollo", "Pisado tradicional de uva", "Souvenir de la vendimia"],
    productor: "Ramiro Quevedo", direccion: "RN 143, km 1057, San Rafael, Mendoza",
    desglose: [{ grupo: "Adultos", cantidad: 3, precio: 11000 }, { grupo: "Menores (4–12)", cantidad: 2, precio: 5500 }],
    participantes: [
      { nombre: "Gabriela Méndez", categoria: "Adulto" }, { nombre: "Esteban Méndez", categoria: "Adulto" },
      { nombre: "Rocío Ferreyra", categoria: "Adulto" }, { nombre: "Joaquín Méndez", categoria: "Menor" },
      { nombre: "Camila Méndez", categoria: "Menor" },
    ],
  },
  {
    id: "RES-9X3P",
    titulo: "Poda y cuidado del viñedo", finca: "Cuartel 5", loc: "Maipú, Mendoza",
    fecha: "2026-07-19", fechaLabel: "19/07/2026", horario: "09:00 — 11:00",
    personas: 2, precioUnit: 8200, estado: "cancelada", seed: 4, photo: "tijeras de poda sobre vid en invierno",
    incluye: ["Taller de poda", "Mate y pastelitos", "Manual impreso"],
    productor: "Inés Cabrera", direccion: "Cuartel V s/n, Maipú, Mendoza",
    desglose: [{ grupo: "Adultos", cantidad: 2, precio: 8200 }],
    participantes: [{ nombre: "Paula Iriarte", categoria: "Adulto" }, { nombre: "Sebastián Iriarte", categoria: "Adulto" }],
  },
  {
    id: "RES-5M1G",
    titulo: "Cosecha de duraznos de estación", finca: "Lote Sur", loc: "Tunuyán, Mendoza",
    fecha: "2026-01-22", fechaLabel: "22/01/2026", horario: "07:30 — 10:00",
    personas: 3, precioUnit: 6900, estado: "finalizada", seed: 5, photo: "duraznos maduros en el árbol",
    incluye: ["Cesta para cosechar", "Llevás 2 kg de fruta", "Desayuno con productos de la finca"],
    productor: "Pedro Aliaga", direccion: "Callejón del Sur 75, Tunuyán, Mendoza",
    desglose: [{ grupo: "Adultos", cantidad: 2, precio: 6900 }, { grupo: "Menores (4–12)", cantidad: 1, precio: 3450 }],
    participantes: [
      { nombre: "Florencia Brizuela", categoria: "Adulto" }, { nombre: "Andrés Brizuela", categoria: "Adulto" },
      { nombre: "Martina Brizuela", categoria: "Menor" },
    ],
  },
];

export const ESTADO_TONE: Record<EstadoReserva, "warning" | "success" | "danger"> = {
  pendiente: "warning",
  finalizada: "success",
  cancelada: "danger",
};

export const ESTADO_LABEL: Record<EstadoReserva, string> = {
  pendiente: "Pagada",
  finalizada: "Finalizada",
  cancelada: "Cancelada",
};

/** Total real de la reserva = suma de subtotales por grupo de edad. */
export function reservaTotal(r: Pick<Reserva, "desglose" | "precioUnit" | "personas">): number {
  if (Array.isArray(r.desglose) && r.desglose.length) {
    return r.desglose.reduce((s, g) => s + g.cantidad * g.precio, 0);
  }
  return r.precioUnit * r.personas;
}

export function getReserva(id: string): Reserva | undefined {
  return RESERVAS.find((r) => r.id === id);
}
