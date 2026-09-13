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

export interface CultivoDetalle {
  id: string;
  nombre: string;
  descripcion: string;
  beneficios: string[];
  calendario: MesEstacionalidad[];
  porcionReferencia: string;
  informacionNutricional: DatoNutricional[];
  actividades: ActividadDeCultivo[];
  // TODO backend: el detalle también manda `recetas`; las recetas siguen yendo
  // por mocks, así que no se mapean todavía.
}

/** Filtro de temporada del listado. `null` es "todos". */
export type FiltroTemporada = boolean | null;

export interface ConsultaCultivos {
  enTemporada: FiltroTemporada;
  /** 0-based, como lo numera el `Pageable` del backend. */
  page: number;
  size: number;
}

export type MesEstado = "r" | "g" | "h"; // reposo · crecimiento · cosecha

export interface NutricionItem {
  label: string;
  value: string;
}

export interface Cultivo {
  id: string;
  nombre: string;
  familia: string;
  descripcion: string;
  seed: number;
  photo: string;
  color: string;
  calendario: MesEstado[];
  nutricion: { porcion: string; items: NutricionItem[] };
  beneficios: string[];
  recetas: string[];
  actividades: string[];
}

export interface Receta {
  id: string;
  nombre: string;
  tiempo: string;
  porciones: number;
  dificultad: string;
  seed: number;
  photo: string;
  cultivos: string[];
  descripcion: string;
  ingredientes: string[];
  pasos: string[];
}

export interface ActividadCultivo {
  id: string;
  titulo: string;
  finca: string;
  loc: string;
  dur: string;
  precio: string;
  seed: number;
  photo: string;
}
