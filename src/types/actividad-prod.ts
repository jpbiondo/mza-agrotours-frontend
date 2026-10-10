import type { CultivoRef } from "@/types/datos";

/**
 * Los estados que devuelve el backend (`EstadoActividadNombre`). Las dadas de
 * baja **sí** vuelven en el listado del productor —el backend las ordena al
 * final—, así que son un estado más y no una fila ausente.
 */
export type EstadoActividad = "publicado" | "borrador" | "dado_de_baja";

export interface DiaHorario {
  /** Nombre del día tal como lo arma el backend, p. ej. "Lunes". */
  dia: string;
  /** "HH:MM". Vacío si el renglón del backend no se pudo separar en día y horas. */
  desde: string;
  hasta: string;
}

/**
 * Consulta del listado del productor, tal como la toma
 * GET /establecimientos/{id}/actividades. La `busqueda` el backend la aplica
 * sólo sobre el **nombre** de la actividad; `estado` en `null` trae todos.
 */
export interface ConsultaActividadesProd {
  establecimientoId: string;
  busqueda: string;
  estado: EstadoActividad | null;
  /** 0-based, como lo numera el `Pageable` del backend. */
  page: number;
  size: number;
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
  /** `cantidadReservasAsociadas`: reservas futuras pendientes o pagadas. */
  reservasAsociadas: number;
  /**
   * Si se puede alternar entre publicado y borrador. Lo decide el backend: no
   * se puede si está dada de baja, ni pasarla a borrador si tiene reservas.
   */
  puedeCambiarEstado: boolean;
}
