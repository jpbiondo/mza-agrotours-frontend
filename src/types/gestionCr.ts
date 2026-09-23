import type { ImagenGuardada } from "@/types/imagen";

import type { DificultadId } from "./recetas";
export type { DificultadId };

export type Estacion = "h" | "g" | "r";

/* ---- Catálogo de cultivos (wireado) -------------------------------------- */

/** Fila de GET /admin/tipos-cultivo/catalogo. */
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

export type UnidadNutricional = "kcal" | "g" | "mg" | "mcg" | "%";

export interface FilaNutricional {
  nombre: string;
  valor: string;
  unidad: UnidadNutricional;
}

/**
 * Datos editables de un cultivo: es a la vez lo que devuelve
 * GET /admin/tipos-cultivo/{id} y lo que se manda en el alta y la edición.
 *
 * `calendario` es la representación interna, la que entienden el editor y la
 * barra. La traducción a `estacionalidadPorMes` vive en el borde del hook, así
 * el formulario nunca ve el castellano del backend; lo mismo con las unidades
 * nutricionales, que del lado del backend son un enum (`GRAMOS`, `KCAL`…).
 */
export interface DatosCultivo {
  nombre: string;
  descripcion: string;
  beneficios: string[];
  calendario: Estacion[];
  /** Sobre qué porción se informan los valores, p. ej. "100 g". */
  porcionReferencia: string;
  informacionNutricional: FilaNutricional[];
  /**
   * Imagen representativa. `null` es "sin imagen", y como el alta y la edición
   * mandan el estado completo, mandarla en `null` la borra.
   */
  foto: ImagenGuardada | null;
}

export interface CultivoOpcion {
  id: string;
  nombre: string;
}

export interface RecetaCatalogo {
  id: string;
  nombre: string;
  nombresCultivos: string[];
  dificultad: DificultadId;
  tiempoMinsAprox: number;
  /** "Rápida", "Media" o "Larga". La deduce el backend del tiempo. */
  duracionNombre: string;
  cantidadPasos: number;
  porciones: number;
  /** Imagen del plato. `null` mientras no se haya cargado ninguna. */
  foto: ImagenGuardada | null;
}

export interface DatosReceta {
  nombre: string;
  cultivosIds: string[];
  dificultad: DificultadId;
  tiempoMinsAprox: number;
  porciones: number;
  descripcion: string;
  ingredientes: string[];
  pasos: string[];
  /**
   * Imagen del plato. `null` es "sin imagen", y como el alta y la edición
   * mandan el estado completo, mandarla en `null` la borra.
   */
  foto: ImagenGuardada | null;
}
