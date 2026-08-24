/* ---- Contratos reales de /establecimientos/{id}/productores -------------- */

/**
 * Item de GET /establecimientos/{id}/productores y respuesta de todo el ABM
 * (alta, cambio de rol, suspensión y levantamiento devuelven el productor).
 */
export interface Productor {
  id: string;
  nombreUsuario: string;
  emailUsuario: string;
  /** La persona puede no haber cargado todavía su documento. */
  identificacion: string | null;
  nombreRol: string;
  /** El Productor Líder es el rol protegido del establecimiento. */
  esLider: boolean;
  fechaHoraAlta: string;
  /**
   * Estado del tramo vigente. El backend manda los nombres de su enum
   * (`ACTIVO`, `LICENCIA` = suspendido, `BAJA`); no se tipa como unión porque
   * es un string libre en el DTO y un valor nuevo no tiene que romper la tabla.
   * Ver `estaSuspendido` en `@/lib/productores`.
   */
  estadoActual: string;
  /**
   * Motivo del tramo de estado abierto. Ojo: el backend lo llena para cualquier
   * tramo, no sólo para las suspensiones — a un productor activo le viaja el
   * motivo de su alta o del último levantamiento. Sólo tiene sentido mostrarlo
   * cuando `estaSuspendido()` da true.
   */
  motivoSuspension: string | null;
  /** Desde cuándo rige el tramo abierto; mismo cuidado que `motivoSuspension`. */
  fechaHoraInicioSuspension: string | null;
  /**
   * Vencimiento previsto de la suspensión vigente. Éste sí es exclusivo de la
   * suspensión: es cuándo se levanta sola, y en un tramo activo viaja null.
   */
  fechaHoraFinSuspension: string | null;
}

/**
 * Item de GET /establecimientos/{id}/productores/roles. El backend ya filtra:
 * sólo devuelve los roles de productor vigentes y asignables del propio
 * establecimiento, así que el de Productor Líder no aparece.
 */
export interface RolProductor {
  id: string;
  nombre: string;
  descripcion: string;
}
