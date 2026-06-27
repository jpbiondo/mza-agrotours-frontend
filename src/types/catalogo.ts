export interface Actividad {
  id: string;
  nombre: string;
  finca: string;
  depto: string;
  cultivos: string[];
  rating: number;
  resenias: number;
  precioAdulto: number;
  tipo: string;
  tag: string | null;
  seed: number;
}

export interface Establecimiento {
  id: string;
  nombre: string;
  depto: string;
  cultivos: string[];
  descripcion: string;
  seed: number;
}

export interface FaqItem {
  id: string;
  cat: string;
  q: string;
  a: string;
}
