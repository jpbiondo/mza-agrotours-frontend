/** Cultivo tal como lo devuelven `/tipos-cultivo` y el establecimiento. */
export interface CultivoRef {
  id: string;
  nombre: string;
}

/**
 * Item de GET /establecimientos/{id}. `ubicacion` y `localidad` no se editan
 * desde el panel; el resto sí, y viaja entero en cada PUT (ver `useGuardarEstablecimiento`).
 */
export interface EstablecimientoDatos {
  id: string;
  nombre: string;
  cuit: string;
  razonSocial: string;
  descripcion: string;
  ubicacion: string;
  localidad: string;
  telefono: string;
  email: string;
  cvu: string;
  cultivos: CultivoRef[];
}

/** Cuerpo de PUT /establecimientos/{id}: todo lo editable, siempre completo. */
export interface EstablecimientoEditable {
  descripcion: string;
  telefono: string;
  email: string;
  cvu: string;
  cultivosIds: string[];
}
