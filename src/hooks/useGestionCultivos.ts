import { useCallback, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../firebase.config";
import { ApiError, apiFetch, comoEnvelope } from "@/lib/api";
import { conToken } from "@/lib/sesion";
import type { CultivoCatalogo, DatosCultivo, Estacion } from "@/types/gestionCr";

const BASE = "/tipos-cultivo";

/* ---- Traducción con el backend -------------------------------------------
   Privada al hook: es vocabulario del backend, no del design system. La
   pantalla trabaja siempre con `Estacion[]` de 12 posiciones. */

/** trim + minúsculas + sin acentos. Lo que no es string cae en "". */
function norm(v: unknown): string {
  if (typeof v !== "string") return "";
  return v
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

/**
 * Nombre de mes → índice. Incluye "setiembre" como alias: el contrato dice
 * Septiembre con p, y una sola letra de diferencia convertiría ese mes en
 * reposo sin que salte ningún error.
 */
const INDICE_MES: Record<string, number> = {
  enero: 0, febrero: 1, marzo: 2, abril: 3, mayo: 4, junio: 5,
  julio: 6, agosto: 7, septiembre: 8, setiembre: 8, octubre: 9,
  noviembre: 10, diciembre: 11,
};

const A_ESTACION: Record<string, Estacion> = {
  cosecha: "h",
  crecimiento: "g",
  reposo: "r",
};

const A_NOMBRE: Record<Estacion, string> = {
  h: "Cosecha",
  g: "Crecimiento",
  r: "Reposo",
};

/** Doce meses en reposo: la base de cualquier calendario. */
function calendarioVacio(): Estacion[] {
  return Array(12).fill("r") as Estacion[];
}

/**
 * Calendario desde el listado (`[{mes, nombre}]`). Indexa **por nombre de mes**,
 * no por posición, así que da igual si viene desordenado, incompleto o con
 * repetidos. Un mes o un estado que no se reconozca se descarta sin tirar la
 * fila entera.
 *
 * Siempre devuelve 12: `GcrSeasonBar` indexa `GCR_MESES[i]` y un array de otro
 * largo dibuja una barra corta o revienta.
 */
function aCalendario(v: unknown): Estacion[] {
  const cal = calendarioVacio();
  if (!Array.isArray(v)) return cal;
  for (const item of v) {
    if (!item || typeof item !== "object") continue;
    const i = INDICE_MES[norm((item as { mes?: unknown }).mes)];
    const e = A_ESTACION[norm((item as { nombre?: unknown }).nombre)];
    if (i !== undefined && e) cal[i] = e;
  }
  return cal;
}

/** Calendario desde el detalle: lista ordenada, índice 0 = Enero. */
function aCalendarioOrdenado(v: unknown): Estacion[] {
  const cal = calendarioVacio();
  if (!Array.isArray(v)) return cal;
  for (let i = 0; i < 12; i++) {
    const e = A_ESTACION[norm(v[i])];
    if (e) cal[i] = e;
  }
  return cal;
}

/** La vuelta: siempre 12 strings, sea cual sea el largo que llegue. */
function aEstacionalidadPorMes(cal: Estacion[]): string[] {
  return Array.from({ length: 12 }, (_, i) => A_NOMBRE[cal[i]] ?? "Reposo");
}

/* ---- Mapeo de las respuestas --------------------------------------------- */

interface CultivoBackend {
  id?: string;
  nombre?: string;
  calendarioEstacionalidad?: unknown;
  resumenCosecha?: string;
  cantidadRecetas?: unknown;
  cantidadActividades?: unknown;
  puedeEliminarse?: unknown;
}

interface CatalogoBackend {
  totalCultivos?: unknown;
  totalRecetas?: unknown;
  cultivos?: CultivoBackend[] | null;
}

interface DetalleBackend {
  nombre?: string;
  descripcion?: string;
  beneficios?: unknown;
  estacionalidadPorMes?: unknown;
}

function aNumero(v: unknown): number {
  return typeof v === "number" && Number.isFinite(v) ? v : 0;
}

function aTextos(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is string => typeof x === "string");
}

function aCultivo(c: CultivoBackend): CultivoCatalogo {
  return {
    id: typeof c.id === "string" ? c.id.trim() : "",
    nombre: c.nombre ?? "",
    calendario: aCalendario(c.calendarioEstacionalidad),
    resumenCosecha: c.resumenCosecha ?? "",
    cantidadRecetas: aNumero(c.cantidadRecetas),
    cantidadActividades: aNumero(c.cantidadActividades),
    // Sólo `true` habilita la baja: ante un valor raro conviene bloquear y no
    // ofrecer un borrado que el backend va a rechazar.
    puedeEliminarse: c.puedeEliminarse === true,
  };
}

/* ---- Catálogo ------------------------------------------------------------ */

interface UseCatalogoReturn {
  /** Siempre definido: `[]` significa "cargó y no hay ninguno". */
  cultivos: CultivoCatalogo[];
  totalRecetas: number;
  isLoading: boolean;
  error: string | null;
  /** Recarga mostrando el esqueleto; para el botón de reintentar. */
  reload: () => void;
  /** Recarga en silencio, sin tocar `isLoading`; para después de mutar. */
  refrescar: () => void;
}

export function useCatalogoCultivos(): UseCatalogoReturn {
  const [cultivos, setCultivos] = useState<CultivoCatalogo[]>([]);
  const [totalRecetas, setTotalRecetas] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    let active = true;

    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!active) return;
      if (!user) {
        setError("Necesitás iniciar sesión para ver el catálogo");
        setIsLoading(false);
        return;
      }
      try {
        const token = await user.getIdToken();
        const res = await apiFetch<unknown>(`${BASE}/catalogo`, { token });
        if (!active) return;
        const env = comoEnvelope<CatalogoBackend>(res);
        if (!env.ok || !env.data) {
          // Si ya hay filas en pantalla, esto es un refresco posterior a una
          // escritura que salió bien: convertir todo en el panel de error haría
          // creer que no se guardó nada. Se queda con los datos viejos.
          setCultivos((prev) => {
            if (prev.length === 0) setError(env.code ?? "No pudimos cargar el catálogo");
            return prev;
          });
          return;
        }
        // Sin id no se puede ni editar ni borrar la fila: se descarta.
        setCultivos((env.data.cultivos ?? []).map(aCultivo).filter((c) => c.id !== ""));
        setTotalRecetas(aNumero(env.data.totalRecetas));
        setError(null);
      } catch (e) {
        if (!active) return;
        setCultivos((prev) => {
          if (prev.length === 0) {
            setError(e instanceof Error ? e.message : "Error inesperado");
          }
          return prev;
        });
      } finally {
        if (active) setIsLoading(false);
      }
    });

    return () => {
      active = false;
      unsub();
    };
  }, [nonce]);

  const reload = useCallback(() => {
    setIsLoading(true);
    setError(null);
    setNonce((n) => n + 1);
  }, []);

  const refrescar = useCallback(() => setNonce((n) => n + 1), []);

  return { cultivos, totalRecetas, isLoading, error, reload, refrescar };
}

/* ---- Detalle ------------------------------------------------------------- */

/**
 * GET /tipos-cultivo/{id}, imperativo: se dispara al tocar "Editar" y la
 * pantalla necesita saber cuándo resolvió para recién ahí abrir el panel, ya
 * poblado. Reactivo obligaría a abrirlo vacío y rellenarlo después.
 */
export function useCultivoDetalle() {
  const [isLoading, setIsLoading] = useState(false);

  async function cargar(
    id: string,
  ): Promise<{ ok: boolean; code?: string; datos?: DatosCultivo }> {
    setIsLoading(true);
    try {
      const res = await conToken((token) =>
        apiFetch<unknown>(`${BASE}/${encodeURIComponent(id)}`, { token }),
      );
      const env = comoEnvelope<DetalleBackend>(res);
      if (!env.ok || !env.data) return { ok: false, code: env.code };
      return {
        ok: true,
        datos: {
          nombre: env.data.nombre ?? "",
          descripcion: env.data.descripcion ?? "",
          beneficios: aTextos(env.data.beneficios),
          calendario: aCalendarioOrdenado(env.data.estacionalidadPorMes),
        },
      };
    } catch (e) {
      if (e instanceof ApiError) return { ok: false, code: e.code };
      return { ok: false };
    } finally {
      setIsLoading(false);
    }
  }

  return { cargar, isLoading };
}

/* ---- Escrituras ---------------------------------------------------------- */

type Resultado = { ok: boolean; code?: string };

/** Cuerpo del alta y de la edición: el backend usa la misma forma para los dos. */
function cuerpo(datos: DatosCultivo) {
  return JSON.stringify({
    nombre: datos.nombre,
    descripcion: datos.descripcion,
    beneficios: datos.beneficios,
    estacionalidadPorMes: aEstacionalidadPorMes(datos.calendario),
  });
}

function comoResultado(e: unknown): Resultado {
  if (e instanceof ApiError) return { ok: false, code: e.code };
  // `apiFetch` sólo llega a res.json() con un 2xx: un error de parseo es una
  // escritura hecha y contestada sin cuerpo.
  if (e instanceof SyntaxError) return { ok: true };
  return { ok: false };
}

export function useCrearCultivo() {
  const [isLoading, setIsLoading] = useState(false);

  async function crear(datos: DatosCultivo): Promise<Resultado> {
    setIsLoading(true);
    try {
      const res = await conToken((token) =>
        apiFetch<unknown>(`${BASE}/alta`, { method: "POST", token, body: cuerpo(datos) }),
      );
      const env = comoEnvelope<unknown>(res);
      return env.ok ? { ok: true } : { ok: false, code: env.code };
    } catch (e) {
      return comoResultado(e);
    } finally {
      setIsLoading(false);
    }
  }

  return { crear, isLoading };
}

export function useActualizarCultivo() {
  const [isLoading, setIsLoading] = useState(false);

  async function actualizar(id: string, datos: DatosCultivo): Promise<Resultado> {
    setIsLoading(true);
    try {
      const res = await conToken((token) =>
        apiFetch<unknown>(`${BASE}/${encodeURIComponent(id)}`, {
          method: "PUT",
          token,
          body: cuerpo(datos),
        }),
      );
      const env = comoEnvelope<unknown>(res);
      return env.ok ? { ok: true } : { ok: false, code: env.code };
    } catch (e) {
      return comoResultado(e);
    } finally {
      setIsLoading(false);
    }
  }

  return { actualizar, isLoading };
}

export function useEliminarCultivo() {
  const [isLoading, setIsLoading] = useState(false);

  async function eliminar(id: string): Promise<Resultado> {
    setIsLoading(true);
    try {
      const res = await conToken((token) =>
        apiFetch<unknown>(`${BASE}/${encodeURIComponent(id)}`, { method: "DELETE", token }),
      );
      const env = comoEnvelope<unknown>(res);
      return env.ok ? { ok: true } : { ok: false, code: env.code };
    } catch (e) {
      return comoResultado(e);
    } finally {
      setIsLoading(false);
    }
  }

  return { eliminar, isLoading };
}
