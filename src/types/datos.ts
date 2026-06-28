export interface CultivoCat {
  id: string;
  nombre: string;
  /** Cantidad de actividades del establecimiento que usan este cultivo; >0 ⇒ no se puede quitar. */
  actividades: number;
}

export interface EstablecimientoDatos {
  // Identidad
  nombre: string;
  cuit: string;
  razonSocial: string;
  descripcion: string;
  // Ubicación (no modificable)
  calle: string;
  localidad: string;
  provincia: string;
  // Contacto
  telefono: string;
  email: string;
  // Operación (no modificable)
  cvu: string;
  // Cultivos asociados (ids del catálogo)
  cultivos: string[];
}
