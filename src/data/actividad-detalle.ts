import { getActividad } from "@/data/actividades";
import { ESTABLECIMIENTOS_DESTACADOS } from "@/data/establecimientos";
import type { Actividad, ActividadDetalle, CategoriaViajero, MesCalendario } from "@/types/catalogo";

export const CUPO_MAXIMO = 12;

export const NOMBRES_DIA = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

export const VIAJEROS: CategoriaViajero[] = [
  { id: "infantes", label: "Infantes", sub: "0 a 2 años", edadMax: 2 },
  { id: "menores", label: "Menores", sub: "3 a 17 años", edadMax: 17 },
  { id: "adultos", label: "Adultos", sub: "18 años o más", edadMax: Infinity },
];

export const MEDIOS_PAGO = [
  { id: "mp", nombre: "Mercado Pago", sub: "Hasta 6 cuotas sin interés" },
  { id: "credito", nombre: "Tarjeta de crédito", sub: "Visa · Mastercard · Amex" },
  { id: "debito", nombre: "Tarjeta de débito", sub: "Visa · Mastercard · Cabal" },
];

export const PRONOSTICO = [
  { fecha: "Lun 23/03", icon: "sun", tMax: 28, tMin: 12, desc: "Soleado", lluvia: 0 },
  { fecha: "Mar 24/03", icon: "sun", tMax: 30, tMin: 14, desc: "Soleado", lluvia: 0 },
  { fecha: "Mié 25/03", icon: "cloud-sun", tMax: 27, tMin: 13, desc: "Parcial", lluvia: 10 },
  { fecha: "Jue 26/03", icon: "cloud", tMax: 24, tMin: 12, desc: "Nublado", lluvia: 30 },
  { fecha: "Vie 27/03", icon: "cloud-drizzle", tMax: 21, tMin: 11, desc: "Lluvia", lluvia: 70 },
];

/* ---- Disponibilidad de cupos por día (mock, deriva del diseño) --------- */

/** UUID con formato válido (placeholder mientras el calendario no viene del backend). */
function idParaDia(year: number, month: number, day: number): string {
  const hex = (n: number, len: number) => n.toString(16).padStart(len, "0");
  return `${hex(year, 8)}-${hex(month + 1, 4)}-${hex(day, 4)}-0000-000000000000`;
}

function makeMarzo(): MesCalendario {
  const cuposByDay: Record<number, number> = {
    5: 8, 6: 4, 8: 12, 10: 11, 11: 6, 12: 2, 13: 9, 15: 7, 17: 5, 18: 10,
    19: 3, 20: 8, 22: 6, 24: 12, 25: 9, 26: 5, 27: 7, 29: 11, 31: 8,
  };
  const days: MesCalendario["days"] = {};
  const daysInMonth = new Date(2026, 3, 0).getDate();
  for (let d = 1; d <= daysInMonth; d++) {
    const dow = new Date(2026, 2, d).getDay();
    const cupos = cuposByDay[d] ?? 0;
    days[d] = { id: idParaDia(2026, 2, d), state: cupos > 0 ? "disponible" : "off", cupos, dow };
  }
  return { year: 2026, month: 2, label: "Marzo 2026", days };
}

function makeAbril(): MesCalendario {
  const cuposByDay: Record<number, number> = { 1: 10, 2: 8, 3: 4, 4: 6, 5: 11 };
  const days: MesCalendario["days"] = {};
  const daysInMonth = new Date(2026, 4, 0).getDate();
  for (let d = 1; d <= daysInMonth; d++) {
    const dow = new Date(2026, 3, d).getDay();
    const cupos = cuposByDay[d] ?? 0;
    days[d] = { id: idParaDia(2026, 3, d), state: cupos > 0 ? "disponible" : "off", cupos, dow };
  }
  return { year: 2026, month: 3, label: "Abril 2026", days };
}

export const CALENDARIO: MesCalendario[] = [makeMarzo(), makeAbril()];

/* ---- Enriquecimiento del detalle a partir del catálogo ----------------- */
function iniciales(nombre: string): string {
  const skip = new Set(["finca", "bodega", "lote", "estancia", "almazara", "ruta", "olivares", "del", "de", "la", "el", "los", "las"]);
  const w = nombre.split(/\s+/).filter((x) => x && !skip.has(x.toLowerCase()));
  return (w.slice(0, 2).map((x) => x[0]).join("") || nombre.slice(0, 2)).toUpperCase();
}

function tipoEstab(cultivos: string[]): string {
  const c = cultivos.join(" ").toLowerCase();
  if (/olivo/.test(c)) return "Olivar y almazara familiar";
  if (/malbec|bonarda|cabernet|vid/.test(c)) return "Bodega boutique familiar";
  if (/cereza|durazno|damasco|pera|manzana/.test(c)) return "Finca frutal familiar";
  if (/nogal/.test(c)) return "Finca de nogales";
  return "Establecimiento rural familiar";
}

function estIdForFinca(finca: string): string | null {
  const e = ESTABLECIMIENTOS_DESTACADOS.find((x) => x.nombre === finca);
  return e ? e.id : null;
}

function build(m: Actividad): ActividadDetalle {
  const loc = `${m.depto}, Mendoza`;
  const cultivosTxt = m.cultivos.join(" y ");
  const s = m.seed;
  return {
    id: m.id,
    titulo: m.nombre,
    finca: m.finca,
    estId: estIdForFinca(m.finca),
    loc,
    tag: m.tag || m.tipo,
    tipo: m.tipo,
    cultivos: m.cultivos,
    duracion: "3 h 30 min",
    edadPermitida: "Todas las edades",
    rating: m.rating,
    totalResenias: m.resenias,
    precioDesde: m.precioAdulto,
    precios: {
      infantes: 0,
      menores: Math.round((m.precioAdulto * 0.7) / 100) * 100,
      adultos: m.precioAdulto,
    },
    fotos: [
      { seed: s, caption: `${m.nombre.toLowerCase()} en ${m.finca}` },
      { seed: (s + 3) % 6, caption: `recorrido por la finca en ${m.depto}` },
      { seed: (s + 1) % 6, caption: `productos de ${cultivosTxt}` },
      { seed: (s + 2) % 6, caption: "paisaje de la finca al atardecer" },
    ],
    descripcion: [
      `Viví ${m.nombre.toLowerCase()} junto a la familia de ${m.finca}, en ${m.depto}. Una experiencia para conocer de cerca el trabajo con ${cultivosTxt} y compartir un momento con quienes cuidan la tierra todos los días.`,
      "Grupos chicos, ritmo tranquilo y trato cálido. Pensada para conectar con el campo mendocino, con respeto por el ciclo natural del cultivo.",
    ],
    incluye: [
      "Guía del productor durante toda la actividad",
      "Herramientas y equipo necesarios para participar",
      `Degustación de productos de ${cultivosTxt}`,
      "Refrigerio de campo con productos de la finca",
      "Recorrido guiado por el establecimiento",
      `Traslado desde el punto de encuentro en ${m.depto}`,
    ],
    noIncluye: [
      "Traslado desde la ciudad de Mendoza",
      "Productos para llevar (disponibles en la tienda de la finca)",
    ],
    establecimiento: {
      nombre: m.finca,
      iniciales: iniciales(m.finca),
      tipo: tipoEstab(m.cultivos),
      loc,
      desde: 2019,
      generaciones: 3,
      bio: `Establecimiento familiar dedicado a ${cultivosTxt} en ${m.depto}. Recibe grupos pequeños para compartir la experiencia del campo y su producción artesanal.`,
    },
    cancelacion: {
      titulo: "Cancelación flexible",
      bullets: [
        "Cancelá gratis hasta 48 h antes de la actividad y recibí un reembolso completo.",
        "Entre 48 h y 24 h antes, se reembolsa el 50 % del total.",
        "Si cancela el productor por clima u otra razón, recibís el 100 %.",
      ],
    },
    faqs: [
      { q: "¿Qué pasa si llueve el día de la actividad?", a: "Si la lluvia hace inviable la actividad, te avisamos con anticipación y reprogramamos o te devolvemos el 100 % del importe." },
      { q: "¿Hay que tener experiencia previa?", a: "No. El productor te guía paso a paso durante toda la experiencia. Es una actividad accesible para todo público." },
      { q: "¿Qué ropa conviene llevar?", a: "Ropa cómoda, calzado cerrado y un abrigo liviano. Gorra y protector solar para las horas de sol." },
      { q: "¿Cómo es el punto de encuentro?", a: `Nos encontramos en un punto acordado en ${m.depto}. Te enviamos la ubicación exacta al confirmar la reserva.` },
    ],
    resenias: [
      { autor: "Federico G.", iniciales: "FG", fecha: "Marzo 2026", rating: 5, texto: `Una experiencia increíble. La familia de ${m.finca} te hace sentir parte del lugar desde el primer minuto. Muy recomendable.` },
      { autor: "Mariana T.", iniciales: "MT", fecha: "Marzo 2026", rating: 5, texto: "Fuimos en familia y la pasamos genial. Todo muy bien explicado, trato cálido y mucha conexión con el campo. Volvemos seguro." },
      { autor: "Joaquín R.", iniciales: "JR", fecha: "Febrero 2026", rating: 4, texto: "Muy linda actividad, bien organizada. La recomiendo para conocer de cerca el trabajo de la finca." },
    ],
  };
}

export function getActividadDetalle(id: string): ActividadDetalle | null {
  const base = getActividad(id);
  return base ? build(base) : null;
}
