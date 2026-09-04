import type { ActividadProd } from "@/types/actividad-prod";
import type { CultivoRef } from "@/types/datos";

/**
 * Actividades del establecimiento (mock). El listado ya lee del backend; esto
 * sigue alimentando el calendario y la pantalla de modificar, que todavía no
 * están wireadas, y los `generateStaticParams` de esas dos rutas.
 */
export const ACTIVIDADES_PROD: ActividadProd[] = [
  { id: "ACT-7K2M", nombre: "Cosecha de Malbec al amanecer", cultivos: [{ id: "c-malbec", nombre: "Malbec" }, { id: "c-cabernet", nombre: "Cabernet Sauvignon" }], precio: 18500, estado: "publicado", reservas: 8, reservasPagadas: 5,
    dias: [{ dia: "Lunes", desde: "06:00", hasta: "11:00" }, { dia: "Miércoles", desde: "06:00", hasta: "11:00" }, { dia: "Viernes", desde: "06:00", hasta: "11:00" }] },
  { id: "ACT-3F8P", nombre: "Poda de viñedo guiada", cultivos: [{ id: "c-malbec", nombre: "Malbec" }], precio: 12000, estado: "publicado",
    dias: [{ dia: "Martes", desde: "09:00", hasta: "12:00" }, { dia: "Jueves", desde: "09:00", hasta: "12:00" }] },
  { id: "ACT-2V5B", nombre: "Cosecha nocturna de uva", cultivos: [{ id: "c-malbec", nombre: "Malbec" }], precio: 16000, estado: "borrador", reservas: 0,
    dias: [{ dia: "Sábado", desde: "21:00", hasta: "01:00" }] },
  { id: "ACT-8N4D", nombre: "Visita a la bodega histórica", cultivos: [{ id: "c-rural", nombre: "Recorrido rural" }], precio: 9000, estado: "borrador", reservas: 0,
    dias: [{ dia: "Jueves", desde: "11:00", hasta: "13:00" }, { dia: "Domingo", desde: "11:00", hasta: "13:00" }] },
  { id: "ACT-9C1R", nombre: "Degustación de vinos de altura", cultivos: [{ id: "c-malbec", nombre: "Malbec" }, { id: "c-bonarda", nombre: "Bonarda" }], precio: 9500, estado: "publicado", reservas: 3,
    dias: [{ dia: "Viernes", desde: "17:00", hasta: "19:00" }, { dia: "Sábado", desde: "17:00", hasta: "19:00" }] },
  { id: "ACT-5T4N", nombre: "Cosecha de aceitunas", cultivos: [{ id: "c-arbequina", nombre: "Olivo Arbequina" }], precio: 11000, estado: "publicado",
    dias: [{ dia: "Sábado", desde: "08:00", hasta: "12:00" }] },
  { id: "ACT-2H6L", nombre: "Recorrido por el olivar y la almazara", cultivos: [{ id: "c-arbequina", nombre: "Olivo Arbequina" }, { id: "c-frantoio", nombre: "Olivo Frantoio" }], precio: 8000, estado: "borrador", reservas: 0,
    dias: [{ dia: "Miércoles", desde: "10:00", hasta: "13:00" }, { dia: "Sábado", desde: "10:00", hasta: "13:00" }] },
  { id: "ACT-8B3K", nombre: "Vendimia familiar", cultivos: [{ id: "c-bonarda", nombre: "Bonarda" }, { id: "c-malbec", nombre: "Malbec" }], precio: 14500, estado: "publicado", reservas: 5, reservasPagadas: 2,
    dias: [{ dia: "Domingo", desde: "09:00", hasta: "13:00" }] },
  { id: "ACT-1D7Q", nombre: "Elaboración de dulces de temporada", cultivos: [{ id: "c-durazno", nombre: "Durazno" }, { id: "c-damasco", nombre: "Damasco" }], precio: 7500, estado: "publicado",
    dias: [{ dia: "Jueves", desde: "15:00", hasta: "18:00" }] },
  { id: "ACT-6M9V", nombre: "Cosecha de cerezas", cultivos: [{ id: "c-cereza", nombre: "Cereza" }], precio: 10000, estado: "publicado",
    dias: [{ dia: "Martes", desde: "07:30", hasta: "11:30" }, { dia: "Jueves", desde: "07:30", hasta: "11:30" }, { dia: "Sábado", desde: "07:30", hasta: "11:30" }] },
  { id: "ACT-4W2J", nombre: "Taller de injertos y vivero", cultivos: [{ id: "c-vid", nombre: "Vid" }], precio: 6500, estado: "borrador", reservas: 0,
    dias: [{ dia: "Lunes", desde: "14:00", hasta: "17:00" }] },
  { id: "ACT-0X5G", nombre: "Picnic entre viñas al atardecer", cultivos: [{ id: "c-malbec", nombre: "Malbec" }], precio: 13000, estado: "publicado",
    dias: [{ dia: "Viernes", desde: "18:30", hasta: "21:00" }, { dia: "Sábado", desde: "18:30", hasta: "21:00" }] },
  { id: "ACT-7Y8F", nombre: "Cosecha de nueces", cultivos: [{ id: "c-nogal", nombre: "Nogal" }], precio: 9000, estado: "publicado",
    dias: [{ dia: "Sábado", desde: "09:00", hasta: "12:00" }, { dia: "Domingo", desde: "09:00", hasta: "12:00" }] },
  { id: "ACT-3R6T", nombre: "Paseo a caballo por la finca", cultivos: [{ id: "c-rural", nombre: "Recorrido rural" }], precio: 15500, estado: "publicado",
    dias: [{ dia: "Miércoles", desde: "16:00", hasta: "18:00" }, { dia: "Sábado", desde: "16:00", hasta: "18:00" }] },
  { id: "ACT-9L1C", nombre: "Cata de aceite de oliva extra virgen", cultivos: [{ id: "c-arbequina", nombre: "Olivo Arbequina" }], precio: 8500, estado: "publicado",
    dias: [{ dia: "Viernes", desde: "11:00", hasta: "12:30" }] },
];

/**
 * Ícono de la tarjeta a partir de los cultivos. El backend no manda ninguno y
 * tampoco tiene por qué: es una decisión de presentación. Se busca por palabra
 * en el nombre y se cae en el brote genérico, que sirve para cualquier cultivo.
 */
export function iconoDeCultivos(cultivos: CultivoRef[]): string {
  const texto = cultivos.map((c) => c.nombre).join(" ").toLowerCase();
  if (/uva|vid|malbec|bonarda|cabernet|torront/.test(texto)) return "grape";
  if (/oliv|aceitun/.test(texto)) return "leaf";
  if (/cereza|durazno|damasco|ciruela|pera|manzana/.test(texto)) return "cherry";
  if (/nog|nuez|nuec/.test(texto)) return "nut";
  if (/vino|bodega/.test(texto)) return "wine";
  if (/recorrido|paseo|rural/.test(texto)) return "map-pin";
  return "sprout";
}

/** Normaliza para búsqueda sin acentos / mayúsculas. */
export function normalizar(s: string): string {
  return (s || "").toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");
}

export function getActividad(id: string): ActividadProd | undefined {
  return ACTIVIDADES_PROD.find((a) => a.id === id);
}
