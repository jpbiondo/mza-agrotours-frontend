import type { Actividad, FilterOption } from "@/types/catalogo";

export type { FilterOption };

/** Catálogo completo de actividades publicadas. */
export const ACTIVIDADES: Actividad[] = [
  { id: "ACT-7K2M", nombre: "Cosecha de Malbec al amanecer", finca: "Finca La Escondida", depto: "Luján de Cuyo", cultivos: ["Malbec"], rating: 4.9, resenias: 47, precioAdulto: 12500, tipo: "Cosecha", tag: "Cupos limitados", seed: 0 },
  { id: "ACT-9C1R", nombre: "Degustación guiada de varietales", finca: "Bodega Los Álamos", depto: "Luján de Cuyo", cultivos: ["Malbec", "Cabernet Sauvignon"], rating: 4.8, resenias: 33, precioAdulto: 9800, tipo: "Degustación", tag: null, seed: 1 },
  { id: "ACT-3F8P", nombre: "Poda y cuidado del viñedo", finca: "Cuartel 5", depto: "Maipú", cultivos: ["Malbec", "Bonarda"], rating: 4.6, resenias: 18, precioAdulto: 8200, tipo: "Taller", tag: null, seed: 4 },
  { id: "ACT-5T4N", nombre: "Recorrido en bodega histórica", finca: "Bodega San Telmo", depto: "Maipú", cultivos: ["Malbec"], rating: 4.7, resenias: 52, precioAdulto: 10500, tipo: "Recorrido", tag: null, seed: 2 },
  { id: "ACT-8B3K", nombre: "Vendimia familiar participativa", finca: "Finca Santa Rosa", depto: "San Rafael", cultivos: ["Bonarda", "Malbec"], rating: 5.0, resenias: 64, precioAdulto: 11000, tipo: "Cosecha", tag: "Para familias", seed: 3 },
  { id: "ACT-1D7Q", nombre: "Cosecha de duraznos de estación", finca: "Lote Sur", depto: "Tunuyán", cultivos: ["Durazno"], rating: 4.8, resenias: 21, precioAdulto: 6900, tipo: "Cosecha", tag: "Temporada", seed: 1 },
  { id: "ACT-6M9V", nombre: "Recorrido por la finca de olivos", finca: "Lote Norte", depto: "Junín", cultivos: ["Olivo Arbequina"], rating: 4.7, resenias: 15, precioAdulto: 7500, tipo: "Recorrido", tag: null, seed: 2 },
  { id: "ACT-4W2J", nombre: "Trekking entre viñedos de altura", finca: "Estancia El Cerro", depto: "Tupungato", cultivos: ["Malbec", "Cabernet Franc"], rating: 4.9, resenias: 28, precioAdulto: 9500, tipo: "Recorrido", tag: null, seed: 3 },
  { id: "ACT-0X5G", nombre: "Picnic entre los nogales", finca: "Finca Los Nogales", depto: "San Carlos", cultivos: ["Nogal"], rating: 4.7, resenias: 19, precioAdulto: 5800, tipo: "Degustación", tag: null, seed: 4 },
  { id: "ACT-7Y8F", nombre: "Visita al dique y viñedos altos", finca: "Finca Potrerillos", depto: "Las Heras", cultivos: ["Malbec"], rating: 4.6, resenias: 12, precioAdulto: 8900, tipo: "Recorrido", tag: null, seed: 0 },
  { id: "ACT-3R6T", nombre: "Tour urbano de bodegas boutique", finca: "Ruta del Vino Urbano", depto: "Capital", cultivos: ["Malbec", "Bonarda"], rating: 4.8, resenias: 41, precioAdulto: 13500, tipo: "Degustación", tag: "Pocos cupos", seed: 1 },
  { id: "ACT-9L1C", nombre: "Cosecha de cerezas de Tunuyán", finca: "Finca El Cerezo", depto: "Tunuyán", cultivos: ["Cereza"], rating: 4.8, resenias: 24, precioAdulto: 7200, tipo: "Cosecha", tag: "Temporada", seed: 5 },
  { id: "ACT-2H6L", nombre: "Cata de aceite de oliva extra virgen", finca: "Almazara La Colina", depto: "Maipú", cultivos: ["Olivo Arbequina", "Olivo Frantoio"], rating: 4.7, resenias: 30, precioAdulto: 8500, tipo: "Degustación", tag: null, seed: 2 },
  { id: "ACT-5K9D", nombre: "Elaboración de dulces de damasco", finca: "Finca Doña Aurora", depto: "San Rafael", cultivos: ["Damasco", "Durazno"], rating: 4.6, resenias: 16, precioAdulto: 6500, tipo: "Taller", tag: null, seed: 3 },
  { id: "ACT-1P4S", nombre: "Cosecha de peras y manzanas", finca: "Finca El Carrizal", depto: "Rivadavia", cultivos: ["Pera", "Manzana"], rating: 4.5, resenias: 11, precioAdulto: 6800, tipo: "Cosecha", tag: "Temporada", seed: 4 },
  { id: "ACT-8N2W", nombre: "Vendimia nocturna a la luz de la luna", finca: "Bodega Viento Sur", depto: "Tunuyán", cultivos: ["Malbec"], rating: 4.9, resenias: 38, precioAdulto: 15500, tipo: "Cosecha", tag: "Cupos limitados", seed: 0 },
  { id: "ACT-6T3L", nombre: "Recorrido por el viñedo orgánico", finca: "Finca Tierra Viva", depto: "Tupungato", cultivos: ["Malbec", "Bonarda"], rating: 4.8, resenias: 27, precioAdulto: 10200, tipo: "Recorrido", tag: null, seed: 3 },
  { id: "ACT-4C7H", nombre: "Degustación de aceites y conservas", finca: "Olivares del Este", depto: "San Martín", cultivos: ["Olivo Arbequina"], rating: 4.5, resenias: 14, precioAdulto: 7000, tipo: "Degustación", tag: null, seed: 5 },
];

/** Subconjunto destacado para la landing. */
export const ACTIVIDADES_DESTACADAS: Actividad[] = [
  "ACT-7K2M", "ACT-8B3K", "ACT-9C1R", "ACT-8N2W", "ACT-9L1C", "ACT-2H6L",
].map((id) => ACTIVIDADES.find((a) => a.id === id)!).filter(Boolean);

/** Opciones del filtro por cultivo, derivadas del catálogo. */
export const CULTIVO_OPTS: FilterOption[] = (() => {
  const counts: Record<string, number> = {};
  ACTIVIDADES.forEach((a) => a.cultivos.forEach((c) => { counts[c] = (counts[c] || 0) + 1; }));
  return Object.keys(counts)
    .sort((a, b) => a.localeCompare(b, "es"))
    .map((c) => ({ value: c, label: c, count: counts[c] }));
})();

/** Opciones del filtro por departamento, derivadas del catálogo. */
export const DEPTO_OPTS: FilterOption[] = (() => {
  const counts: Record<string, number> = {};
  ACTIVIDADES.forEach((a) => { counts[a.depto] = (counts[a.depto] || 0) + 1; });
  return Object.keys(counts)
    .sort((a, b) => a.localeCompare(b, "es"))
    .map((d) => ({ value: d, label: d, count: counts[d] }));
})();

export function getActividad(id: string): Actividad | undefined {
  return ACTIVIDADES.find((a) => a.id === id);
}
