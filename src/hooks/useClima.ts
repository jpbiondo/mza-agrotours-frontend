import { useAsync } from "@/hooks/useAsync";
import type { AsyncState } from "@/hooks/useAsync";
import { ApiError, apiFetch, comoEnvelope } from "@/lib/api";
import type { CondicionClima, DiaPronostico, PronosticoDepartamento } from "@/types/clima";

/**
 * Pronóstico del clima por departamento.
 *
 * La lectura va **sin token**: `/clima/**` está abierto en el backend y esto se
 * muestra en pantallas de `(sitio)`, que se ven sin sesión. Mismo criterio que
 * `useCatalogoActividades`.
 *
 * El pronóstico lo refresca un scheduler del backend contra OpenWeather y queda
 * cacheado por departamento, así que pedirlo en cada detalle no cuesta una
 * llamada a la API externa.
 */
const BASE = "/clima";

/** Los códigos que este front sabe dibujar; el resto se ignora. */
const CONDICIONES: readonly CondicionClima[] = [
  "CLEAR_SKY", "FEW_CLOUDS", "SCATTERED_CLOUDS", "BROKEN_CLOUDS",
  "SHOWER_RAIN", "RAIN", "THUNDERSTORM", "SNOW", "MIST",
];

/* ---- Respuestas crudas --------------------------------------------------- */

/** Día crudo. Campos opcionales: defensivo. */
interface DiaBackend {
  fecha?: unknown;
  temperaturaMin?: unknown;
  temperaturaMax?: unknown;
  probabilidadLluvia?: unknown;
  condicion?: unknown;
  // El backend manda también `temperaturaMed`, que la pantalla no muestra.
}

interface PronosticoBackend {
  departamento?: unknown;
  clima?: unknown;
}

/* ---- Mapeo --------------------------------------------------------------- */

function aTexto(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

function aNumeroOpcional(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

/** Un código que este front no conoce se trata como día sin condición. */
function aCondicion(v: unknown): CondicionClima | null {
  return CONDICIONES.find((c) => c === v) ?? null;
}

/** Sin fecha no hay día que ubicar en la grilla, así que esa fila se descarta. */
function aDia(d: DiaBackend): DiaPronostico | null {
  const fecha = aTexto(d.fecha);
  if (fecha === "") return null;
  return {
    fecha,
    temperaturaMin: aNumeroOpcional(d.temperaturaMin),
    temperaturaMax: aNumeroOpcional(d.temperaturaMax),
    // Se acota al rango: un valor fuera de 0-100 es un dato roto, y mostrar
    // "340 % de lluvia" es peor que mostrar el extremo.
    probabilidadLluvia: Math.min(100, Math.max(0, aNumeroOpcional(d.probabilidadLluvia) ?? 0)),
    condicion: aCondicion(d.condicion),
  };
}

/* ---- Lectura ------------------------------------------------------------- */

/**
 * `null` significa "no hay pronóstico para este departamento": el backend no lo
 * tiene cargado, o el scheduler todavía no corrió. No es una falla de la
 * pantalla —el clima es un extra del detalle—, así que el llamador esconde la
 * sección en vez de mostrar el panel de error.
 */
async function verPronostico(departamento: string): Promise<PronosticoDepartamento | null> {
  try {
    const res = await apiFetch<unknown>(`${BASE}/${encodeURIComponent(departamento)}`);
    const env = comoEnvelope<PronosticoBackend>(res);
    if (!env.ok || !env.data) return null;

    const crudos = Array.isArray(env.data.clima) ? env.data.clima : [];
    const dias = crudos
      .filter((d): d is DiaBackend => !!d && typeof d === "object")
      .map(aDia)
      .filter((d): d is DiaPronostico => d !== null)
      // El backend ya los manda por fecha, pero la grilla se lee de izquierda a
      // derecha como una línea de tiempo: el orden no puede depender de eso.
      .sort((a, b) => a.fecha.localeCompare(b.fecha));

    return { departamento: aTexto(env.data.departamento) || departamento, dias };
  } catch (e) {
    // Un departamento que el backend no conoce tampoco es una falla técnica.
    if (e instanceof ApiError && (e.status === 404 || e.status === 400)) return null;
    throw e;
  }
}

/* ---- Hook ---------------------------------------------------------------- */

/**
 * Pronóstico de un departamento. `data` en `null` es "no hay pronóstico"; con
 * el nombre vacío —una actividad sin departamento cargado— no se pide nada.
 */
export function usePronosticoClima(
  departamento: string,
): AsyncState<PronosticoDepartamento | null> {
  return useAsync<PronosticoDepartamento | null>(
    () => (departamento ? verPronostico(departamento) : Promise.resolve(null)),
    [departamento],
  );
}
