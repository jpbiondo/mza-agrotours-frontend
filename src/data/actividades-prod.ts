import type { ActividadProd, EstadoActividad, EstadoBucket } from "@/types/actividad-prod";

/** Actividades dadas de alta en el establecimiento del productor (mock). */
export const ACTIVIDADES_PROD: ActividadProd[] = [
  { id: "ACT-7K2M", nombre: "Cosecha de Malbec al amanecer", icon: "grape", cultivos: ["Malbec", "Cabernet Sauvignon"], precio: 18500, estado: "publicado", reservas: 8, reservasPagadas: 5,
    dias: [{ dia: "Lunes", desde: "06:00", hasta: "11:00" }, { dia: "Miércoles", desde: "06:00", hasta: "11:00" }, { dia: "Viernes", desde: "06:00", hasta: "11:00" }] },
  { id: "ACT-3F8P", nombre: "Poda de viñedo guiada", icon: "scissors", cultivos: ["Malbec"], precio: 12000, estado: "activo",
    dias: [{ dia: "Martes", desde: "09:00", hasta: "12:00" }, { dia: "Jueves", desde: "09:00", hasta: "12:00" }] },
  { id: "ACT-2V5B", nombre: "Cosecha nocturna de uva", icon: "grape", cultivos: ["Malbec"], precio: 16000, estado: "baja", reservas: 0, fechaBaja: "12/06/2026",
    dias: [{ dia: "Sábado", desde: "21:00", hasta: "01:00" }] },
  { id: "ACT-8N4D", nombre: "Visita a la bodega histórica", icon: "wine", cultivos: ["Recorrido rural"], precio: 9000, estado: "baja", reservas: 0, fechaBaja: "03/05/2026",
    dias: [{ dia: "Jueves", desde: "11:00", hasta: "13:00" }, { dia: "Domingo", desde: "11:00", hasta: "13:00" }] },
  { id: "ACT-9C1R", nombre: "Degustación de vinos de altura", icon: "wine", cultivos: ["Malbec", "Bonarda"], precio: 9500, estado: "publicado", reservas: 3,
    dias: [{ dia: "Viernes", desde: "17:00", hasta: "19:00" }, { dia: "Sábado", desde: "17:00", hasta: "19:00" }] },
  { id: "ACT-5T4N", nombre: "Cosecha de aceitunas", icon: "leaf", cultivos: ["Olivo Arbequina"], precio: 11000, estado: "activo",
    dias: [{ dia: "Sábado", desde: "08:00", hasta: "12:00" }] },
  { id: "ACT-2H6L", nombre: "Recorrido por el olivar y la almazara", icon: "leaf", cultivos: ["Olivo Arbequina", "Olivo Frantoio"], precio: 8000, estado: "borrador", reservas: 0,
    dias: [{ dia: "Miércoles", desde: "10:00", hasta: "13:00" }, { dia: "Sábado", desde: "10:00", hasta: "13:00" }] },
  { id: "ACT-8B3K", nombre: "Vendimia familiar", icon: "grape", cultivos: ["Bonarda", "Malbec"], precio: 14500, estado: "publicado", reservas: 5, reservasPagadas: 2,
    dias: [{ dia: "Domingo", desde: "09:00", hasta: "13:00" }] },
  { id: "ACT-1D7Q", nombre: "Elaboración de dulces de temporada", icon: "cherry", cultivos: ["Durazno", "Damasco"], precio: 7500, estado: "activo",
    dias: [{ dia: "Jueves", desde: "15:00", hasta: "18:00" }] },
  { id: "ACT-6M9V", nombre: "Cosecha de cerezas", icon: "cherry", cultivos: ["Cereza"], precio: 10000, estado: "activo",
    dias: [{ dia: "Martes", desde: "07:30", hasta: "11:30" }, { dia: "Jueves", desde: "07:30", hasta: "11:30" }, { dia: "Sábado", desde: "07:30", hasta: "11:30" }] },
  { id: "ACT-4W2J", nombre: "Taller de injertos y vivero", icon: "sprout", cultivos: ["Vid"], precio: 6500, estado: "borrador", reservas: 0,
    dias: [{ dia: "Lunes", desde: "14:00", hasta: "17:00" }] },
  { id: "ACT-0X5G", nombre: "Picnic entre viñas al atardecer", icon: "wine", cultivos: ["Malbec"], precio: 13000, estado: "activo",
    dias: [{ dia: "Viernes", desde: "18:30", hasta: "21:00" }, { dia: "Sábado", desde: "18:30", hasta: "21:00" }] },
  { id: "ACT-7Y8F", nombre: "Cosecha de nueces", icon: "nut", cultivos: ["Nogal"], precio: 9000, estado: "activo",
    dias: [{ dia: "Sábado", desde: "09:00", hasta: "12:00" }, { dia: "Domingo", desde: "09:00", hasta: "12:00" }] },
  { id: "ACT-3R6T", nombre: "Paseo a caballo por la finca", icon: "map-pin", cultivos: ["Recorrido rural"], precio: 15500, estado: "activo",
    dias: [{ dia: "Miércoles", desde: "16:00", hasta: "18:00" }, { dia: "Sábado", desde: "16:00", hasta: "18:00" }] },
  { id: "ACT-9L1C", nombre: "Cata de aceite de oliva extra virgen", icon: "leaf", cultivos: ["Olivo Arbequina"], precio: 8500, estado: "activo",
    dias: [{ dia: "Viernes", desde: "11:00", hasta: "12:30" }] },
];

/** Estado → grupo del filtro. publicado/activo → "publicado"; baja/inactivo → "baja". */
export function estadoBucket(estado: EstadoActividad): EstadoBucket {
  if (estado === "borrador") return "borrador";
  if (estado === "baja") return "baja";
  return "publicado";
}

/** Normaliza para búsqueda sin acentos / mayúsculas. */
export function normalizar(s: string): string {
  return (s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}
