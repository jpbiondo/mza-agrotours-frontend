import type { FotoRef } from "@/types/catalogo";

/** Enum `Dificultad` del backend. */
export type DificultadId = "FACIL" | "MEDIA" | "DIFICIL";

/**
 * Enum `DuracionNombre`. No se carga a mano: el backend la deduce del tiempo de
 * preparación, así que del lado del front sólo se lee (filtro y etiqueta).
 */
export type DuracionId = "RAPIDA" | "MEDIA" | "LARGA";

/** Cultivo asociado a una receta, tal como lo listan el catálogo y el detalle. */
export interface CultivoDeReceta {
  id: string;
  nombre: string;
}

export interface RecetaResumen {
  id: string;
  nombre: string;
  cultivos: CultivoDeReceta[];
  dificultad: DificultadId;
  /** Ya viene formateado del backend, p. ej. "1 h 15 min". */
  tiempo: string;
  porciones: number;
  cantidadPasos: number;
  /** Imagen del plato. `null` mientras no se haya cargado ninguna. */
  foto: FotoRef | null;
}

export interface PasoReceta {
  numero: number;
  descripcion: string;
}

export interface RecetaDetalle {
  id: string;
  nombre: string;
  descripcion: string;
  tiempo: string;
  porciones: number;
  dificultad: DificultadId;
  cultivos: CultivoDeReceta[];
  ingredientes: string[];
  pasos: PasoReceta[];
  /** Imagen del plato. `null` mientras no se haya cargado ninguna. */
  foto: FotoRef | null;
}

/** Opción de un filtro, con cuántas recetas caen en ella. */
export interface OpcionFiltro<T> {
  valor: T;
  cantidad: number;
}

/** Cultivo del filtro: además del id y el nombre trae su contador. */
export interface CultivoConRecetas extends CultivoDeReceta {
  cantidad: number;
}

/**
 * Las tres listas de filtros, en una sola lectura. El backend devuelve sólo los
 * valores que hoy tienen recetas, así que las opciones vacías no llegan.
 */
export interface FiltrosRecetas {
  dificultades: OpcionFiltro<DificultadId>[];
  duraciones: OpcionFiltro<DuracionId>[];
  cultivos: CultivoConRecetas[];
}

/** Criterio de orden del listado. `null` es el que ya aplica el backend. */
export type OrdenRecetas = string | null;

/** `null` en cualquiera de los filtros es "sin filtrar". */
export interface ConsultaRecetas {
  dificultad: DificultadId | null;
  duracion: DuracionId | null;
  cultivoId: string | null;
  orden: OrdenRecetas;
  /** 0-based, como lo numera el `Pageable` del backend. */
  page: number;
  size: number;
}
