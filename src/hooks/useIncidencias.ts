import { useCallback, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../firebase.config";
import { ApiError, apiFetch, comoEnvelope, comoPagina } from "@/lib/api";
import { conToken } from "@/lib/sesion";
import {
  GI_ESTADO_BACKEND, GI_ORDEN_ESTADOS, giEsTerminal, giEstadoDesde,
} from "@/data/incidencias";
import type {
  ConteosIncidencias, EstadoIncidencia, Incidencia, IncidenciaDetalle,
} from "@/types/incidencias";

const BASE = "/admin/incidencias";
export const INCIDENCIAS_POR_PAGINA = 10;

/** Fila cruda de `GET /admin/incidencias`. Campos opcionales: defensivo. */
interface IncidenciaBackend {
  id?: string;
  titulo?: string;
  nombreUsuario?: string;
  descripcionCorta?: string;
  // Sic: el DTO del backend lo escribe así.
  fechaHoraIncio?: unknown;
  fechaHoraFin?: unknown;
  estado?: string;
}

/** Respuesta cruda de `GET /admin/incidencias/{id}`. */
interface DetalleBackend {
  id?: string;
  titulo?: string;
  descripcion?: string;
  fechaHoraIncio?: unknown;
  fechaHoraFin?: unknown;
  estadoactual?: string;
  estadosPosibles?: unknown;
  motivo?: string | null;
}

/** Respuesta cruda de `GET /admin/incidencias/filtros/estados`. */
interface MetricaBackend {
  totalAbiertas?: unknown;
  totalTodas?: unknown;
  conteosPorEstado?: Record<string, unknown>;
}

/** Un LocalDateTime mal serializado llega como array: sólo vale el string. */
const fecha = (v: unknown): string | null => (typeof v === "string" && v.trim() ? v : null);
const numero = (v: unknown): number => (typeof v === "number" && Number.isFinite(v) ? v : 0);

function aIncidencia(i: IncidenciaBackend, n: number): Incidencia {
  return {
    id: i.id ?? `sin-id-${n}`,
    titulo: i.titulo ?? "",
    usuario: i.nombreUsuario ?? "",
    descCorta: i.descripcionCorta ?? "",
    estado: giEstadoDesde(i.estado),
    fechaInicio: fecha(i.fechaHoraIncio),
    fechaFin: fecha(i.fechaHoraFin),
  };
}

function aConteos(m: MetricaBackend | undefined): ConteosIncidencias {
  const porEstado = Object.fromEntries(
    GI_ORDEN_ESTADOS.map((e) => [e, numero(m?.conteosPorEstado?.[GI_ESTADO_BACKEND[e]])]),
  ) as Record<EstadoIncidencia, number>;
  return { todas: numero(m?.totalTodas), abiertas: numero(m?.totalAbiertas), porEstado };
}

function aDetalle(d: DetalleBackend): IncidenciaDetalle {
  const estado = giEstadoDesde(d.estadoactual);
  return {
    id: d.id ?? "",
    titulo: d.titulo ?? "",
    desc: d.descripcion ?? "",
    estado,
    fechaInicio: fecha(d.fechaHoraIncio),
    fechaFin: fecha(d.fechaHoraFin),
    estadosPosibles: Array.isArray(d.estadosPosibles)
      ? d.estadosPosibles.map(giEstadoDesde).filter((e): e is EstadoIncidencia => e !== null)
      : [],
    // El backend manda el motivo del estado actual, que en los abiertos es un
    // texto automático ("Creación de incidencia"): sólo el de cierre es del admin.
    motivo: estado && giEsTerminal(estado) ? d.motivo?.trim() || null : null,
  };
}

interface UseIncidenciasReturn {
  /** La página pedida; `[]` significa "cargó y no hay ninguna". */
  incidencias: Incidencia[];
  conteos: ConteosIncidencias;
  /** Total de incidencias con el filtro aplicado (no sólo de esta página). */
  total: number;
  totalPaginas: number;
  isLoading: boolean;
  error: string | null;
  reload: () => void;
}

const SIN_CONTEOS: ConteosIncidencias = {
  todas: 0,
  abiertas: 0,
  porEstado: { reportada: 0, revision: 0, resuelta: 0, desestimada: 0 },
};

/**
 * Una página del listado de gestión más los conteos de los filtros, en
 * paralelo y bajo un único estado de carga. El filtro y el paginado los
 * resuelve el backend; el orden (más recientes primero) es su default.
 *
 * `pagina` es 1-based, como la muestra la pantalla.
 */
export function useIncidencias(estado: EstadoIncidencia | "todas", pagina: number): UseIncidenciasReturn {
  const [nonce, setNonce] = useState(0);
  const [cargado, setCargado] = useState<{
    clave: string;
    incidencias: Incidencia[];
    conteos: ConteosIncidencias;
    total: number;
    totalPaginas: number;
    error: string | null;
  } | null>(null);

  const clave = `${nonce}|${estado}|${pagina}`;
  const alDia = cargado?.clave === clave;

  useEffect(() => {
    let active = true;
    const params = new URLSearchParams({
      page: String(pagina - 1),
      size: String(INCIDENCIAS_POR_PAGINA),
    });
    if (estado !== "todas") params.set("estado", GI_ESTADO_BACKEND[estado]);

    const fin = (datos: Partial<Omit<NonNullable<typeof cargado>, "clave">>) =>
      setCargado({
        clave, incidencias: [], conteos: SIN_CONTEOS, total: 0, totalPaginas: 0, error: null, ...datos,
      });

    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!active) return;
      if (!user) {
        fin({ error: "Necesitás iniciar sesión para ver las incidencias" });
        return;
      }
      try {
        const token = await user.getIdToken();
        const [resLista, resConteos] = await Promise.all([
          apiFetch<unknown>(`${BASE}?${params}`, { token }),
          apiFetch<unknown>(`${BASE}/filtros/estados`, { token }),
        ]);
        if (!active) return;
        const envLista = comoEnvelope<unknown>(resLista);
        const envConteos = comoEnvelope<MetricaBackend>(resConteos);
        if (!envLista.ok || !envConteos.ok) {
          fin({ error: envLista.code ?? envConteos.code ?? "No pudimos cargar las incidencias" });
          return;
        }
        const pag = comoPagina<IncidenciaBackend>(envLista.data);
        fin({
          incidencias: pag.items.map(aIncidencia),
          conteos: aConteos(envConteos.data),
          total: pag.totalElements,
          totalPaginas: pag.totalPages,
        });
      } catch (e) {
        if (active) fin({ error: e instanceof Error ? e.message : "Error inesperado" });
      }
    });

    return () => {
      active = false;
      unsub();
    };
  }, [clave, estado, pagina]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);

  return {
    incidencias: alDia ? cargado.incidencias : [],
    // Los conteos quedan a la vista mientras se cambia de filtro o de página:
    // los chips no tienen por qué parpadear en cero.
    conteos: cargado?.conteos ?? SIN_CONTEOS,
    total: alDia ? cargado.total : 0,
    totalPaginas: alDia ? cargado.totalPaginas : 0,
    isLoading: !alDia,
    error: alDia ? cargado.error : null,
    reload,
  };
}

/**
 * El formulario de gestión de una incidencia: descripción completa y a qué
 * estados se puede pasar. Lectura disparada por el usuario (abrir el modal),
 * así que sale con `conToken`.
 */
export async function pedirDetalleIncidencia(
  id: string,
): Promise<{ ok: true; detalle: IncidenciaDetalle } | { ok: false; code?: string }> {
  try {
    const res = await conToken((token) =>
      apiFetch<unknown>(`${BASE}/${encodeURIComponent(id)}`, { token }),
    );
    const env = comoEnvelope<DetalleBackend>(res);
    if (!env.ok || !env.data) return { ok: false, code: env.code };
    return { ok: true, detalle: aDetalle(env.data) };
  } catch (e) {
    return { ok: false, code: e instanceof ApiError ? e.code : undefined };
  }
}

/** Cambio de estado de una incidencia; el motivo sólo viaja al cerrarla. */
export function useGestionarIncidencia() {
  const [guardando, setGuardando] = useState(false);

  async function guardar(
    id: string,
    estado: EstadoIncidencia,
    motivo: string | null,
  ): Promise<{ ok: boolean; code?: string }> {
    setGuardando(true);
    try {
      const res = await conToken((token) =>
        apiFetch<unknown>(`${BASE}/${encodeURIComponent(id)}`, {
          method: "PUT",
          token,
          body: JSON.stringify({ estado: GI_ESTADO_BACKEND[estado], motivo }),
        }),
      );
      const env = comoEnvelope<unknown>(res);
      return env.ok ? { ok: true } : { ok: false, code: env.code };
    } catch (e) {
      if (e instanceof ApiError) return { ok: false, code: e.code };
      // 2xx con cuerpo vacío: se guardó.
      if (e instanceof SyntaxError) return { ok: true };
      return { ok: false };
    } finally {
      setGuardando(false);
    }
  }

  return { guardar, guardando };
}
