import type { Actividad } from "@/types/catalogo";

/** Actividades destacadas que se muestran en la landing. */
export const ACTIVIDADES_DESTACADAS: Actividad[] = [
  { id: "ACT-7K2M", nombre: "Cosecha de Malbec al amanecer", finca: "Finca La Escondida", depto: "Luján de Cuyo", cultivos: ["Malbec"], rating: 4.9, resenias: 47, precioAdulto: 12500, tipo: "Cosecha", tag: "Cupos limitados", seed: 0 },
  { id: "ACT-8B3K", nombre: "Vendimia familiar participativa", finca: "Finca Santa Rosa", depto: "San Rafael", cultivos: ["Bonarda", "Malbec"], rating: 5.0, resenias: 64, precioAdulto: 11000, tipo: "Cosecha", tag: "Para familias", seed: 3 },
  { id: "ACT-9C1R", nombre: "Degustación guiada de varietales", finca: "Bodega Los Álamos", depto: "Luján de Cuyo", cultivos: ["Malbec", "Cabernet Sauvignon"], rating: 4.8, resenias: 33, precioAdulto: 9800, tipo: "Degustación", tag: null, seed: 1 },
  { id: "ACT-8N2W", nombre: "Vendimia nocturna a la luz de la luna", finca: "Bodega Viento Sur", depto: "Tunuyán", cultivos: ["Malbec"], rating: 4.9, resenias: 38, precioAdulto: 15500, tipo: "Cosecha", tag: "Cupos limitados", seed: 0 },
  { id: "ACT-9L1C", nombre: "Cosecha de cerezas de Tunuyán", finca: "Finca El Cerezo", depto: "Tunuyán", cultivos: ["Cereza"], rating: 4.8, resenias: 24, precioAdulto: 7200, tipo: "Cosecha", tag: "Temporada", seed: 5 },
  { id: "ACT-2H6L", nombre: "Cata de aceite de oliva extra virgen", finca: "Almazara La Colina", depto: "Maipú", cultivos: ["Olivo Arbequina", "Olivo Frantoio"], rating: 4.7, resenias: 30, precioAdulto: 8500, tipo: "Degustación", tag: null, seed: 2 },
];
