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
  fechaCreacion: string | null;
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
