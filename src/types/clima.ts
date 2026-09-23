/* Pronóstico del clima por departamento (GET /clima/{departamentoNombre}). */

/**
 * Condición predominante del día, con los códigos del enum `CondicionClima` del
 * backend. El backend se queda con la de mayor prioridad entre los tramos de
 * tres horas del día, así que una tormenta a la tarde le gana al sol de la
 * mañana: es el peor pronóstico del día, no el promedio.
 */
export type CondicionClima =
  | "CLEAR_SKY"
  | "FEW_CLOUDS"
  | "SCATTERED_CLOUDS"
  | "BROKEN_CLOUDS"
  | "SHOWER_RAIN"
  | "RAIN"
  | "THUNDERSTORM"
  | "SNOW"
  | "MIST";

/** Un día del pronóstico. */
export interface DiaPronostico {
  /** `LocalDate` del backend: "2026-09-22", sin hora ni zona. */
  fecha: string;
  /** `null` si el backend no la mandó; el día se dibuja igual, sin el número. */
  temperaturaMin: number | null;
  temperaturaMax: number | null;
  /** Porcentaje de 0 a 100: el backend ya escala el `pop` de OpenWeather. */
  probabilidadLluvia: number;
  /** `null` ante un código que este front todavía no conoce. */
  condicion: CondicionClima | null;
}

/** GET /clima/{departamentoNombre}. */
export interface PronosticoDepartamento {
  /** El nombre tal como lo guarda el backend, que no siempre lleva tilde. */
  departamento: string;
  /** Ordenados por fecha, de hoy en adelante. Vacío es "todavía sin datos". */
  dias: DiaPronostico[];
}
