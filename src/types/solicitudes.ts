export type EstadoSolicitud = "pendiente" | "validada" | "rechazada";

/**
 * Item de GET /solicitudes-establecimiento/me (DTO SolicitudEstablecimientoShortDTO):
 * la vista del visitante sobre sus propias solicitudes.
 *
 * Usa `cuit`, la grafía real del backend y la misma del payload de create. La
 * `Solicitud` de más abajo —mock del panel de administración— usa `cuil`.
 * TODO backend: unificar en `cuit` cuando el panel admin deje de usar el mock.
 */
export interface SolicitudResumen {
  id: string;
  nombreEstablecimiento: string;
  razonSocial: string;
  cuit: string;
  domicilioLegal: string;
  estado: EstadoSolicitud;
  /** ISO-8601 con offset (Instant). `null` si el backend no la mandó. */
  fechaHoraAlta: string | null;
}

/** Prueba documental ya subida al object storage. */
export interface PruebaSolicitud {
  /** Nombre visible del archivo, tal como lo cargó el usuario. */
  nombre: string;
  extension: string;
  /** Ruta del objeto en el proveedor; se combina con la URL base para descargarlo. */
  key: string;
}

/** Un paso del historial: por qué estado pasó la solicitud y cuándo. */
export interface CambioEstado {
  estado: EstadoSolicitud;
  /** ISO-8601. `null` si el backend no la mandó. */
  fecha: string | null;
  /** Devolución del administrador en ese cambio. */
  observaciones: string;
}

/**
 * Item de GET /solicitudes-establecimiento/me/{id}: el registro completo de una
 * solicitud propia, con la documentación cargada y el historial de estados.
 */
export interface SolicitudDetalle {
  id: string;
  nombreEstablecimiento: string;
  razonSocial: string;
  cuit: string;
  departamento: string;
  domicilioLegal: string;
  email: string;
  telefono: string;
  cvu: string;
  estado: EstadoSolicitud;
  /** ISO-8601. `null` si el backend no la mandó. */
  fechaHoraAlta: string | null;
  /** Del cambio más reciente al más antiguo. */
  estados: CambioEstado[];
  pruebas: PruebaSolicitud[];
}

export interface PruebaArchivo {
  name: string;
  type: string;
  size: number;
}

export interface ProductorSol {
  nombre: string;
  dni: string;
  email: string;
  miembroDesde: string;
}

export interface Solicitud {
  id: string;
  nombreEstablecimiento: string;
  cuil: string;
  razonSocial: string;
  descripcion: string;
  domicilioLegal: string;
  departamento: string;
  email: string;
  telefono: string;
  pruebas: PruebaArchivo[];
  productor: ProductorSol;
  estado: EstadoSolicitud;
  solicitado: string;
  observacion: string;
  resueltoPor?: string;
  resuelto?: string;
}

export interface EstabVigente {
  nombre: string;
  cuil: string;
  razonSocial: string;
  email: string;
}

export interface Coincidencias {
  cuil: boolean;
  razonSocial: boolean;
  email: boolean;
  alguna: boolean;
}
