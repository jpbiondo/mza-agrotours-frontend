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
