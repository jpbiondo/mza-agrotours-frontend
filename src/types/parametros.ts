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
}

export type ParametroKey = keyof Parametros;

/** Lo que se guarda: el PUT reemplaza todo, así que no hay campos opcionales. */
export type DatosParametros = { [K in ParametroKey]: NonNullable<Parametros[K]> };

export interface ParamField {
  key: ParametroKey;
  group: "finanzas" | "reglas";
  label: string;
  /** Clave de ícono lucide. */
  icon: string;
  kind: "int" | "percent";
  hint: string;
  unit?: string;
}
