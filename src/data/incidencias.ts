import type { EstadoIncidencia } from "@/types/incidencias";

export const GI_ESTADOS: Record<EstadoIncidencia, { label: string; tone: "info" | "warning" | "success" | "neutral" }> = {
  reportada: { label: "Reportada", tone: "info" },
  revision: { label: "En revisión", tone: "warning" },
  resuelta: { label: "Resuelta", tone: "success" },
  desestimada: { label: "Desestimada", tone: "neutral" },
};

export const GI_ORDEN_ESTADOS: EstadoIncidencia[] = ["reportada", "revision", "resuelta", "desestimada"];

export function giEsTerminal(estado: EstadoIncidencia): boolean {
  return estado === "resuelta" || estado === "desestimada";
}

/**
 * `EstadoIncidenciaNombre` viaja por su `name()` (no tiene `@JsonValue`), tanto
 * en las respuestas como en los filtros y en el cuerpo del PUT.
 */
export const GI_ESTADO_BACKEND: Record<EstadoIncidencia, string> = {
  reportada: "REPORTADA",
  revision: "EN_REVISION",
  resuelta: "RESUELTA",
  desestimada: "DESESTIMADA",
};

const DESDE_BACKEND: Record<string, EstadoIncidencia> = Object.fromEntries(
  Object.entries(GI_ESTADO_BACKEND).map(([id, nombre]) => [nombre, id as EstadoIncidencia]),
);

/** Estado del backend → id de acá; `null` si es uno que no conocemos. */
export function giEstadoDesde(v: unknown): EstadoIncidencia | null {
  return typeof v === "string" ? (DESDE_BACKEND[v] ?? null) : null;
}

/**
 * Referencia corta para citar un caso. Sale del UUID, así que es estable y es
 * la misma en la pantalla del visitante y en la de gestión; no es un código
 * del backend.
 */
export function giCodigo(id: string): string {
  return `INC-${id.replace(/-/g, "").slice(0, 8).toUpperCase()}`;
}
