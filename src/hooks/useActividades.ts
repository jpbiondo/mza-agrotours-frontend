import { useCallback, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../firebase.config";
import { apiFetch, comoEnvelope } from "@/lib/api";
import { aCultivos } from "@/hooks/useTiposCultivo";
import type { ActividadProd, DiaHorario, EstadoActividad } from "@/types/actividad-prod";

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

const ESTADOS: Record<string, EstadoActividad> = {
  PUBLICADO: "publicado",
  BORRADOR: "borrador",
};

/**
 * Un estado que no conocemos cae en "borrador", que es la lectura prudente: si
 * mostráramos como publicada una actividad que no lo está, el productor creería
 * que los visitantes la ven y perdería reservas sin enterarse. Al revés el error
 * es visible y el arreglo es un clic.
 */
function aEstado(v: unknown): EstadoActividad {
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

function aActividades(v: unknown): ActividadProd[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((a): a is ActividadBackend => !!a && typeof a === "object")
    .map((a) => ({
      id: typeof a.id === "string" ? a.id : "",
      nombre: a.nombre ?? "",
      cultivos: aCultivos(a.cultivos),
      precio: Number(a.precioRegular) || 0,
      estado: aEstado(a.estado),
      dias: aDias(a.diasYHorasDisponibles),
    }))
    // Sin id no hay a dónde navegar ni sobre qué operar.
    .filter((a) => a.id !== "");
}

interface UseActividadesReturn {
  data: ActividadProd[] | null;
  isLoading: boolean;
  error: string | null;
  reload: () => void;
}

/** GET /establecimientos/{id}/actividades */
export function useActividades(establecimientoId: string): UseActividadesReturn {
  const [nonce, setNonce] = useState(0);
  // Clave vacía = no hay nada que pedir. Sin establecimiento la pantalla muestra
  // su propio aviso, así que no debe quedar girando.
  const clave = establecimientoId ? `${nonce}|${establecimientoId}` : "";

  // La carga se deriva de si el resultado guardado corresponde a la clave
  // actual, en vez de prenderla con un setState adentro del efecto —que
  // dispara un render de más y lo prohíbe la regla de hooks—.
  const [res, setRes] = useState<{ clave: string; data: ActividadProd[] | null; error: string | null }>(
    { clave: "", data: null, error: null },
  );

  useEffect(() => {
    if (!clave) return;
    let active = true;

    // Se espera a que Firebase restaure la sesión: al montar la pantalla
    // `auth.currentUser` todavía está vacío y el pedido saldría sin token.
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!active) return;
      if (!user) {
        setRes({ clave, data: null, error: "Necesitás iniciar sesión para ver las actividades" });
        return;
      }
      try {
        const token = await user.getIdToken();
        const r = await apiFetch<unknown>(actividadesPath(establecimientoId), { token });
        if (!active) return;
        const env = comoEnvelope<unknown>(r);
        setRes(
          env.ok
            ? { clave, data: aActividades(env.data), error: null }
            : { clave, data: null, error: env.code ?? "No pudimos cargar las actividades" },
        );
      } catch (e) {
        if (active) setRes({ clave, data: null, error: e instanceof Error ? e.message : "Error inesperado" });
      }
    });

    return () => {
      active = false;
      unsub();
    };
  }, [clave, establecimientoId]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);
  const isLoading = clave !== "" && res.clave !== clave;

  return {
    data: isLoading ? null : res.data,
    error: isLoading ? null : res.error,
    isLoading,
    reload,
  };
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
