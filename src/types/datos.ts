import type { FotoClaim } from "@/types/actividad-foto";

/**
 * Portada del establecimiento tal como la devuelve el GET (DTOFotosResponse).
 * Es una sola imagen: la primera que ven los visitantes en el perfil público.
 */
export interface FotoPortada {
  /** Key en el bucket; es lo que vuelve al backend para conservarla. */
  key: string;
  nombre: string;
  /** URL de descarga prefirmada. Vence: no sirve para guardar en ningún lado. */
  downloadUrl: string;
}

/** Cultivo tal como lo devuelven `/tipo-cultivo` y el establecimiento. */
export interface CultivoRef {
  id: string;
  nombre: string;
}

/**
 * Item de GET /establecimientos/{id}. `ubicacion`, `localidad` y `cultivos` son
 * de sólo lectura —los cultivos salen de las actividades del establecimiento—;
 * el resto se edita y viaja entero en cada PUT (ver `useGuardarEstablecimiento`).
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
  /** `null` cuando la finca todavía no tiene portada. */
  foto: FotoPortada | null;
}

/**
 * Condición que el establecimiento NO cumple para poder darse de baja, tal como
 * la devuelve GET /establecimientos/{id}/condiciones-baja. Misma forma que la
 * de la baja de cuenta (`CondicionIncumplida` en `@/data/cuenta`), pero son
 * dominios distintos: se repite el tipo en vez de acoplar las dos pantallas.
 */
export interface CondicionBaja {
  nombre: string;
  descripcion: string;
}

/**
 * Cuerpo de PUT /establecimientos/{id}: todo lo editable, siempre completo.
 *
 * **Ojo con `foto`:** el PUT reemplaza el estado entero, así que mandarla en
 * `null` —u omitirla, que para Jackson es lo mismo— borra la portada. Cualquier
 * guardado, aunque sea de otra sección, tiene que arrastrar la que ya estaba.
 */
export interface EstablecimientoEditable {
  nombre: string;
  descripcion: string;
  telefono: string;
  email: string;
  cvu: string;
  foto: FotoClaim | null;
}
