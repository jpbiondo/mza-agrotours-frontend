export type DiaKey = "lunes" | "martes" | "miercoles" | "jueves" | "viernes" | "sabado" | "domingo";

/**
 * Un rango etario con su precio. El productor los renombra, les cambia las
 * edades, agrega y borra: no hay tramos fijos. Las edades y el precio viajan
 * como texto porque son campos en edición —"" es "todavía no escribió nada",
 * que no es lo mismo que 0—; el hook de guardado los pasa a número.
 */
export interface TarifaFila {
  /** Sólo del cliente: identifica la fila mientras se edita. No viaja al backend. */
  id: string;
  /**
   * Id que le puso el backend, si la fila ya existía. Sólo lo llena la
   * modificación: en el alta ninguna tarifa lo tiene todavía.
   */
  backendId?: string;
  nombre: string;
  min: string;
  max: string;
  precio: string;
  /** Sin marcar, la fila queda de plantilla: ni se valida ni se manda. */
  on: boolean;
  base: boolean;
}

export interface DiaCfg {
  on: boolean;
  desde: string;
  hasta: string;
}

export interface FaqItem {
  q: string;
  a: string;
}

export interface ActividadFormData {
  nombre: string;
  descripcion: string;
  cupos: string;
  cultivos: string[];
  tarifas: TarifaFila[];
  days: Record<DiaKey, DiaCfg>;
  fechaDesde: string;
  fechaHasta: string;
  incluye: string[];
  noIncluye: string[];
  faqs: FaqItem[];
}
