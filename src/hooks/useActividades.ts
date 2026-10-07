import { useCallback, useEffect, useRef, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../firebase.config";
import { ApiError, apiFetch, comoEnvelope, comoPagina } from "@/lib/api";
import { conToken } from "@/lib/sesion";
import type { Pagina } from "@/lib/api";
import { aCultivos } from "@/hooks/useTiposCultivo";
import type { ActividadProd, ConsultaActividadesProd, DiaHorario, EstadoActividad } from "@/types/actividad-prod";

/**
 * El listado de un establecimiento es chico, así que se pide una sola página grande
 */
function actividadesPath(establecimientoId: string): string {
  const qs = new URLSearchParams({ page: "0", size: "200" });
  return `/establecimientos/${encodeURIComponent(establecimientoId)}/actividades?${qs.toString()}`;
}

/** Fila cruda del listado. Todo opcional: defensivo. */
interface ActividadBackend {
  id?: string;
  nombre?: string;
  estado?: unknown;
  precioRegular?: unknown;
  diasYHorasDisponibles?: unknown;
  cultivos?: unknown;
  cantidadReservasAsociadas?: unknown;
  puedeCambiarEstado?: unknown;
}

/** Contador por estado de `GET .../actividades/estados`. */
interface FiltroEstadoBackend {
  valor?: unknown;
  cantidad?: unknown;
}

const ESTADOS: Record<string, EstadoActividad> = {
  PUBLICADO: "publicado",
  BORRADOR: "borrador",
  DADO_DE_BAJA: "dado_de_baja",
};

/** El nombre del enum del backend, que es como viaja el filtro `estado`. */
const ESTADO_BACKEND: Record<EstadoActividad, string> = {
  publicado: "PUBLICADO",
  borrador: "BORRADOR",
  dado_de_baja: "DADO_DE_BAJA",
};

/**
 * Un estado que no conocemos cae en "borrador", que es la lectura prudente: si
 * mostráramos como publicada una actividad que no lo está, el productor creería
 * que los visitantes la ven y perdería reservas sin enterarse. Al revés el error
 * es visible y el arreglo es un clic.
 */
export function aEstado(v: unknown): EstadoActividad {
  return (typeof v === "string" && ESTADOS[v.trim().toUpperCase()]) || "borrador";
}

/**
 * El backend arma cada renglón como "Lunes 16:56 - 17:59". Se separa para poder
 * alinear el día y las horas en columnas; si el formato cambia, el renglón se
 * muestra entero en vez de perderse.
 */
const RENGLON = /^(.+?)\s+(\d{1,2}:\d{2})\s*[-–—]\s*(\d{1,2}:\d{2})$/;

export function aDias(v: unknown): DiaHorario[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((s): s is string => typeof s === "string" && s.trim() !== "")
    .map((s) => {
      const m = RENGLON.exec(s.trim());
      return m ? { dia: m[1], desde: m[2], hasta: m[3] } : { dia: s.trim(), desde: "", hasta: "" };
    });
}

function aActividad(a: ActividadBackend): ActividadProd {
  return {
    id: typeof a.id === "string" ? a.id : "",
    nombre: a.nombre ?? "",
    cultivos: aCultivos(a.cultivos),
    precio: Number(a.precioRegular) || 0,
    estado: aEstado(a.estado),
    dias: aDias(a.diasYHorasDisponibles),
    reservasAsociadas: Number(a.cantidadReservasAsociadas) || 0,
    // Si no viene se deja intentar: el backend valida igual y rechaza con código.
    puedeCambiarEstado: typeof a.puedeCambiarEstado === "boolean" ? a.puedeCambiarEstado : true,
  };
}

/**
 * Query del listado. La búsqueda vacía y el estado sin elegir se omiten: el
 * backend los trata igual que ausentes, pero así la URL queda limpia.
 */
function queryListado({ busqueda, estado, page, size }: ConsultaActividadesProd): string {
  const qs = new URLSearchParams();
  const texto = busqueda.trim();
  if (texto) qs.set("busqueda", texto);
  if (estado) qs.set("estado", ESTADO_BACKEND[estado]);
  qs.set("page", String(page));
  qs.set("size", String(size));
  return `?${qs.toString()}`;
}

interface UseAsyncConToken<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
  reload: () => void;
}

/**
 * Lectura con token que arranca al montar la pantalla. Se espera a que Firebase
 * restaure la sesión (`onAuthStateChanged`): al montar, `auth.currentUser`
 * todavía está vacío y el pedido saldría sin token.
 *
 * La carga se deriva de si el resultado guardado corresponde a la clave actual,
 * en vez de prenderla con un setState adentro del efecto —que dispara un render
 * de más y lo prohíbe la regla de hooks—. Una `clave` vacía significa que no hay
 * nada que pedir, y entonces no queda girando.
 */
function useLecturaConToken<T>(
  clave: string,
  pedir: (token: string) => Promise<T>,
  mensajeSinSesion: string,
): UseAsyncConToken<T> {
  const [nonce, setNonce] = useState(0);
  const claveConNonce = clave ? `${nonce}|${clave}` : "";
  const [res, setRes] = useState<{ clave: string; data: T | null; error: string | null }>(
    { clave: "", data: null, error: null },
  );

  // Siempre invocar la última versión del fetcher sin re-disparar por su identidad.
  const pedirRef = useRef(pedir);
  useEffect(() => { pedirRef.current = pedir; });

  useEffect(() => {
    if (!claveConNonce) return;
    let active = true;

    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!active) return;
      if (!user) {
        setRes({ clave: claveConNonce, data: null, error: mensajeSinSesion });
        return;
      }
      try {
        const token = await user.getIdToken();
        const data = await pedirRef.current(token);
        if (active) setRes({ clave: claveConNonce, data, error: null });
      } catch (e) {
        if (active) setRes({ clave: claveConNonce, data: null, error: e instanceof Error ? e.message : "Error inesperado" });
      }
    });

    return () => {
      active = false;
      unsub();
    };
  }, [claveConNonce, mensajeSinSesion]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);
  const isLoading = claveConNonce !== "" && res.clave !== claveConNonce;

  return {
    data: isLoading ? null : res.data,
    error: isLoading ? null : res.error,
    isLoading,
    reload,
  };
}

const SIN_SESION = "Necesitás iniciar sesión para ver las actividades";

/**
 * GET /establecimientos/{id}/actividades. Búsqueda, filtro por estado y
 * paginado los resuelve el backend, así que cambiar cualquiera vuelve a pedir.
 */
export function useActividades(consulta: ConsultaActividadesProd): UseAsyncConToken<Pagina<ActividadProd>> {
  const { establecimientoId } = consulta;
  // Sin establecimiento no hay nada que pedir: la pantalla muestra su aviso.
  const clave = establecimientoId ? queryListado(consulta) + `|${establecimientoId}` : "";

  return useLecturaConToken<Pagina<ActividadProd>>(
    clave,
    async (token) => {
      const r = await apiFetch<unknown>(`${actividadesPath(establecimientoId)}${queryListado(consulta)}`, { token });
      const env = comoEnvelope<unknown>(r);
      if (!env.ok) throw new Error(env.code ?? "No pudimos cargar las actividades");
      // Envelope ok sin `data` es página vacía, no error. Sin id no hay a dónde
      // navegar ni sobre qué operar, así que esa fila se descarta.
      const pagina = comoPagina<ActividadBackend>(env.data);
      return { ...pagina, items: pagina.items.map(aActividad).filter((a) => a.id !== "") };
    },
    SIN_SESION,
  );
}

/**
 * GET /establecimientos/{id}/actividades/estados: cuántas actividades hay de
 * cada estado, para los contadores del selector. Los estados sin ninguna no
 * vienen en la respuesta, así que el que falta cuenta 0.
 *
 * Ojo: el `DTOFiltro` que arma el backend para esta faceta sólo llena `valor` y
 * `cantidad` —el constructor que toma el enum no setea `nombre`—, así que la
 * etiqueta la pone la pantalla.
 */
export function useEstadosActividad(establecimientoId: string): UseAsyncConToken<Record<EstadoActividad, number>> {
  return useLecturaConToken<Record<EstadoActividad, number>>(
    establecimientoId ? `estados|${establecimientoId}` : "",
    async (token) => {
      const r = await apiFetch<unknown>(`${actividadesPath(establecimientoId)}/estados`, { token });
      const env = comoEnvelope<FiltroEstadoBackend[]>(r);
      if (!env.ok) throw new Error(env.code ?? "No pudimos cargar los estados");
      const counts: Record<EstadoActividad, number> = { publicado: 0, borrador: 0, dado_de_baja: 0 };
      for (const f of env.data ?? []) {
        // Un valor que no conocemos se ignora en vez de sumarse a "borrador":
        // acá no hay una lectura prudente, sólo un contador que quedaría mal.
        const estado = typeof f.valor === "string" ? ESTADOS[f.valor.trim().toUpperCase()] : undefined;
        if (estado) counts[estado] = Number(f.cantidad) || 0;
      }
      return counts;
    },
    SIN_SESION,
  );
}

/* ---- Acciones sobre una actividad ---------------------------------------- */

/** Resultado de una escritura: `code` es el código de dominio si vino. */
export interface ResultadoAccion {
  ok: boolean;
  code?: string;
}

/** Mutaciones sobre una actividad: dar de baja y cambiar estado de publicación. */
export function useActividadAcciones(establecimientoId: string) {
  const [pendingId, setPendingId] = useState<string | null>(null);

  /**
   * DELETE /establecimientos/{estId}/actividades/{actividadId}. El backend
   * cancela los días futuros y las reservas; con reservas pagadas la rechaza
   * (`A.reservasPagadas`), que el listado no deja anticipar.
   */
  async function darDeBaja(id: string): Promise<ResultadoAccion> {
    return escribir(id, "DELETE");
  }

  /**
   * PATCH /establecimientos/{estId}/actividades/{actividadId}/estado. Sólo se
   * alterna entre publicado y borrador: la baja va por su propio camino.
   */
  async function cambiarEstado(
    id: string,
    nuevo: Exclude<EstadoActividad, "dado_de_baja">,
  ): Promise<ResultadoAccion> {
    return escribir(id, "PATCH", "/estado", { estado: ESTADO_BACKEND[nuevo] });
  }

  async function escribir(id: string, method: string, sufijo = "", body?: unknown): Promise<ResultadoAccion> {
    setPendingId(id);
    try {
      const res = await conToken((token) =>
        apiFetch<unknown>(
          `/establecimientos/${encodeURIComponent(establecimientoId)}/actividades/${encodeURIComponent(id)}${sufijo}`,
          { method, token, body: body === undefined ? undefined : JSON.stringify(body) },
        ),
      );
      const env = comoEnvelope<unknown>(res);
      return env.ok ? { ok: true } : { ok: false, code: env.code };
    } catch (e) {
      if (e instanceof ApiError) return { ok: false, code: e.code };
      // 2xx sin cuerpo: el cambio se hizo.
      if (e instanceof SyntaxError) return { ok: true };
      return { ok: false };
    } finally {
      setPendingId(null);
    }
  }

  return { darDeBaja, cambiarEstado, pendingId };
}
