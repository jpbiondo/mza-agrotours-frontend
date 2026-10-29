/**
 * Parámetros globales del sistema, en el vocabulario de la pantalla. En una
 * base recién creada todavía no se cargaron, así que cualquiera puede venir
 * `null`.
 */
export interface Parametros {
  /** Porcentaje, no fracción: 12.25 es 12,25 %. La conversión la hace el hook. */
  comision: number | null;
  diasMaxActividad: number | null;
  diasMinReembolso: number | null;
  /** En minutos. */
  ttlReserva: number | null;
  diasImpago: number | null;
  /** C del promedio bayesiano: cuántas calificaciones ficticias suma cada actividad y establecimiento. */
  cantidadFicticias: number | null;
  /** m del promedio bayesiano, de 0 a 5. Se ignora con `usarPromedioGlobal`. */
  puntajeFicticio: number | null;
  /** Si las calificaciones ficticias valen el promedio global del sistema en vez de `puntajeFicticio`. */
  usarPromedioGlobal: boolean | null;
}

export type ParametroKey = keyof Parametros;

/** Lo que se guarda: el PUT reemplaza todo, así que no hay campos opcionales. */
export type DatosParametros = { [K in ParametroKey]: NonNullable<Parametros[K]> };

export interface ParamField {
  key: ParametroKey;
  group: "finanzas" | "reglas" | "ranking";
  label: string;
  /** Clave de ícono lucide. */
  icon: string;
  /** `decimal` admite hasta dos decimales; `flag` es un sí/no. */
  kind: "int" | "percent" | "decimal" | "flag";
  hint: string;
  unit?: string;
}
