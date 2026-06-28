export type EstadoActividad = "publicado" | "activo" | "borrador" | "baja";

export type EstadoBucket = "publicado" | "borrador" | "baja";

export interface DiaHorario {
  dia: string;
  desde: string;
  hasta: string;
}

export interface ActividadProd {
  id: string;
  nombre: string;
  /** Clave de ícono lucide. */
  icon: string;
  cultivos: string[];
  precio: number;
  estado: EstadoActividad;
  reservas?: number;
  reservasPagadas?: number;
  fechaBaja?: string;
  dias: DiaHorario[];
}
