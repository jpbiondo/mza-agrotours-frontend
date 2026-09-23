import type { FotoRef } from "@/types/catalogo";

import type { DificultadId } from "./recetas";

export type EstadoMes = "cosecha" | "crecimiento" | "reposo";

export interface MesEstacionalidad {
  indice: number;
  etiqueta: string;
  estado: EstadoMes;
}

export interface CultivoResumen {
  id: string;
  nombre: string;
  resumenCosecha: string;
  enTemporada: boolean;
  /** Imagen representativa. `null` mientras el admin no haya cargado ninguna. */
  foto: FotoRef | null;
}

export interface TotalesTemporada {
  todos: number;
  enTemporada: number;
  fueraDeTemporada: number;
}

export interface DatoNutricional {
  nombre: string;
  /** "69 kcal", "18 g", "10 %". */
  valor: string;
}

/** Actividad en la que se cosecha el cultivo, tal como la lista su detalle. */
export interface ActividadDeCultivo {
  id: string;
  titulo: string;
  establecimiento: string;
  departamento: string;
  precio: number | null;
}

/**
 * Receta en la que entra el cultivo, tal como la lista su detalle. Es un resumen
 * más corto que el del recetario: no trae ni cultivos ni cantidad de pasos.
 */
export interface RecetaDeCultivo {
  id: string;
  nombre: string;
  /** Ya viene formateado del backend, p. ej. "1 h 15 min". */
  tiempo: string;
  porciones: number;
  dificultad: DificultadId;
  /** Imagen del plato. `null` mientras no se haya cargado ninguna. */
  foto: FotoRef | null;
}

export interface CultivoDetalle {
  id: string;
  nombre: string;
  descripcion: string;
  beneficios: string[];
  calendario: MesEstacionalidad[];
  porcionReferencia: string;
  informacionNutricional: DatoNutricional[];
  recetas: RecetaDeCultivo[];
  actividades: ActividadDeCultivo[];
  /** Imagen representativa. `null` mientras el admin no haya cargado ninguna. */
  foto: FotoRef | null;
}

/** Filtro de temporada del listado. `null` es "todos". */
export type FiltroTemporada = boolean | null;

export interface ConsultaCultivos {
  enTemporada: FiltroTemporada;
  /** 0-based, como lo numera el `Pageable` del backend. */
  page: number;
  size: number;
}

