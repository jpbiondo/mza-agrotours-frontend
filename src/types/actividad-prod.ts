import type { CultivoRef } from "@/types/datos";

/** Los dos únicos estados que devuelve el backend. Una actividad dada de baja
 *  no vuelve en el listado, así que no hay un estado para representarla. */
export type EstadoActividad = "publicado" | "borrador";

export interface DiaHorario {
  /** Nombre del día tal como lo arma el backend, p. ej. "Lunes". */
  dia: string;
  /** "HH:MM". Vacío si el renglón del backend no se pudo separar en día y horas. */
  desde: string;
  hasta: string;
}

/** Fila de GET /establecimientos/{id}/actividades. */
export interface ActividadProd {
  id: string;
  nombre: string;
  cultivos: CultivoRef[];
  /** `precioRegular` del backend: el de la tarifa base. */
  precio: number;
  estado: EstadoActividad;
  dias: DiaHorario[];
  /**
   * TODO backend: el listado todavía no manda las reservas. Sin ellas la
   * pantalla no puede bloquear el pasaje a borrador ni la baja de una actividad
   * con reservas pagadas, así que quedan opcionales y quien las lea tiene que
   * contemplar el `undefined`.
   */
  reservas?: number;
  reservasPagadas?: number;
}
