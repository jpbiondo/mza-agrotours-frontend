import type { ActividadResumen, FotoRef } from "@/types/catalogo";

import type { RecetaResumen } from "./recetas";

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

export interface CultivoDetalle {
  id: string;
  nombre: string;
  descripcion: string;
  beneficios: string[];
  calendario: MesEstacionalidad[];
  porcionReferencia: string;
  informacionNutricional: DatoNutricional[];
  /** Recetas y actividades con la misma forma que sus catálogos, para dibujarlas con la misma tarjeta. */
  recetas: RecetaResumen[];
  actividades: ActividadResumen[];
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

