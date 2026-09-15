import { useCallback, useEffect, useRef, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../firebase.config";
import { apiFetch, comoEnvelope, comoPagina } from "@/lib/api";
import type { Pagina } from "@/lib/api";
import { aCultivos } from "@/hooks/useTiposCultivo";
import type { ActividadProd, ConsultaActividadesProd, DiaHorario, EstadoActividad } from "@/types/actividad-prod";

function actividadesPath(establecimientoId: string): string {
  return `/establecimientos/${encodeURIComponent(establecimientoId)}/actividades`;
}

/** Fila cruda del listado. Todo opcional: defensivo. */
interface ActividadBackend {
  id?: string;
  nombre?: string;
  estado?: unknown;
  precioRegular?: unknown;
  diasYHorasDisponibles?: unknown;
  cultivos?: unknown;
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

/* ---- Acciones sobre una actividad ----------------------------------------
   TODO backend: no hay endpoints todavía para la baja ni para el cambio de
   estado de publicación, así que siguen simuladas. La pantalla ya está armada
   para wirearlas: cada una devuelve una promesa y expone el id en curso. */

/** Mutaciones sobre una actividad: dar de baja y cambiar estado de publicación. */
export function useActividadAcciones() {
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function darDeBaja(id: string): Promise<void> {
    setPendingId(id);
    try { await mockDarDeBaja(id); } finally { setPendingId(null); }
  }

  async function cambiarEstado(id: string, nuevo: EstadoActividad): Promise<void> {
    setPendingId(id);
    try { await mockCambiarEstado(id, nuevo); } finally { setPendingId(null); }
  }

  return { darDeBaja, cambiarEstado, pendingId };
}

// MOCK — reemplazar por DELETE /establecimientos/{id}/actividades/{actividadId}
async function mockDarDeBaja(_id: string): Promise<void> {
  await new Promise<void>((res) => setTimeout(res, 700));
}

// MOCK — reemplazar por el endpoint de cambio de estado
async function mockCambiarEstado(_id: string, _nuevo: EstadoActividad): Promise<void> {
  await new Promise<void>((res) => setTimeout(res, 500));
}
