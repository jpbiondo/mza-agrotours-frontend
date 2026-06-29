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
