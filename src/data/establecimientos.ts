import type { Establecimiento } from "@/types/catalogo";

/** Establecimientos destacados que se muestran en la landing. */
export const ESTABLECIMIENTOS_DESTACADOS: Establecimiento[] = [
  { id: "EST-ESCONDIDA", nombre: "Finca La Escondida", depto: "Luján de Cuyo", cultivos: ["Malbec", "Bonarda"], seed: 0,
    descripcion: "Finca familiar de cuarta generación en el Valle de Uco. Cosecha, poda y degustación de Malbec y Bonarda, con almuerzos de huerta propia." },
  { id: "EST-ALAMOS", nombre: "Finca Los Álamos", depto: "Luján de Cuyo", cultivos: ["Malbec", "Cabernet Sauvignon"], seed: 3,
    descripcion: "Viñedos clásicos rodeados de álamos centenarios. Recorridos guiados y degustación de varietales junto a quien los produce." },
  { id: "EST-VIENTOSUR", nombre: "Bodega Viento Sur", depto: "Tunuyán", cultivos: ["Malbec"], seed: 0,
    descripcion: "Bodega boutique de altura en Tunuyán. Vendimias nocturnas y catas de Malbec con vista a la cordillera." },
  { id: "EST-SANTAROSA", nombre: "Finca Santa Rosa", depto: "San Rafael", cultivos: ["Bonarda", "Malbec"], seed: 1,
    descripcion: "Establecimiento de San Rafael pensado para familias. Vendimia participativa y elaboración artesanal de mosto." },
  { id: "EST-LOTENORTE", nombre: "Lote Norte Olivares", depto: "Junín", cultivos: ["Olivo Arbequina"], seed: 2,
    descripcion: "Olivar de más de cien hectáreas. Recorridos por la almazara y cata de aceite de oliva extra virgen recién prensado." },
  { id: "EST-CERRO", nombre: "Estancia El Cerro", depto: "Tupungato", cultivos: ["Malbec", "Cabernet Franc"], seed: 3,
    descripcion: "Viñedos de altura sobre la falda del cerro en Tupungato. Trekking entre hileras y degustación al aire libre." },
];
