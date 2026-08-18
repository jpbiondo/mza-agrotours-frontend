export type ParametroKey =
  | "logo" | "nombre" | "moneda" | "cvu" | "comision"
  | "diasFuturos" | "diasReembolso" | "ttlReserva";

export type Parametros = Record<ParametroKey, string>;

export interface ParamField {
  key: ParametroKey;
  group: "identidad" | "finanzas" | "reglas";
  label: string;
  /** Clave de ícono lucide. */
  icon: string;
  kind: "logo" | "text" | "int" | "float";
  hint: string;
  max?: number;
  unit?: string;
  mono?: boolean;
}
