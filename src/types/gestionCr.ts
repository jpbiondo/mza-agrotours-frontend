export type Estacion = "h" | "g" | "r";
export type Dificultad = "Fácil" | "Media" | "Difícil";
export type DuracionId = "rapida" | "media" | "larga";

export interface GcrCultivo {
  id: string;
  nombre: string;
  familia: string;
  descripcion: string;
  /** Gradiente CSS de la miniatura. */
  color: string;
  /** 12 meses, cada uno cosecha/crecimiento/reposo. */
  calendario: Estacion[];
  beneficios: string[];
  /** Actividades vigentes que cosechan el cultivo (bloquea la baja). */
  actividades: number;
  estado: "activo";
}

/* ---- Catálogo de cultivos (wireado) --------------------------------------
   `GcrCultivo` de arriba sigue siendo el modelo mock que alimenta la pantalla
   de recetas. Estos tipos son los del backend y viven al lado en vez de
   reemplazarlo: son dos universos con ciclos de vida distintos, y mutar
   `GcrCultivo` rompería recetas sin ganar nada. */

/** Fila de GET /tipos-cultivo/catalogo. */
export interface CultivoCatalogo {
  id: string;
  nombre: string;
  /** Siempre 12 posiciones, índice 0 = Enero. Lo garantiza el mapeo del hook. */
  calendario: Estacion[];
  /** Rango legible que arma el backend, p. ej. "Mar-Abr". */
  resumenCosecha: string;
  cantidadRecetas: number;
  cantidadActividades: number;
  /** Lo decide el backend; el front no recalcula la regla. */
  puedeEliminarse: boolean;
}

/**
 * Datos editables de un cultivo: es a la vez lo que devuelve
 * GET /tipos-cultivo/{id} y lo que se manda en el alta y la edición.
 *
 * `calendario` es la representación interna, la que entienden el editor y la
 * barra. La traducción a `estacionalidadPorMes` vive en el borde del hook, así
 * el formulario nunca ve el castellano del backend.
 */
export interface DatosCultivo {
  nombre: string;
  descripcion: string;
  beneficios: string[];
  calendario: Estacion[];
}

export interface GcrReceta {
  id: string;
  nombre: string;
  dificultad: Dificultad;
  tiempo: string;
  duracion: DuracionId;
  porciones: number;
  /** IDs de cultivos asociados. */
  cultivos: string[];
  descripcion: string;
  ingredientes: string[];
  pasos: string[];
  estado: "activo";
}
