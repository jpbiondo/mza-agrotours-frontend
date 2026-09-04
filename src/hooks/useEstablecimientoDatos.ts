import { useCallback, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../firebase.config";
import { ApiError, apiFetch, comoEnvelope } from "@/lib/api";
import { conToken } from "@/lib/sesion";
import type {
  CultivoRef,
  EstablecimientoDatos,
  EstablecimientoEditable,
} from "@/types/datos";

const BASE = "/establecimientos";
const TIPOS_CULTIVO = "/tipos-cultivo";

/** Registro crudo del backend. Campos opcionales: defensivo. */
interface DatosBackend {
  id?: string;
  nombre?: string;
  cuit?: string;
  razonSocial?: string;
  descripcion?: string;
  ubicacion?: string;
  localidad?: string;
  telefono?: string;
  email?: string;
  cvu?: string;
  cultivos?: unknown;
}

interface CultivoBackend {
  id?: string;
  nombre?: string;
}

/**
 * Cultivos con id y nombre. Se descarta el que no traiga id: es lo que viaja en
 * `cultivosIds` al guardar, así que sin él no se podría ni conservar.
 */
function aCultivos(v: unknown): CultivoRef[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((c): c is CultivoBackend => !!c && typeof c === "object")
    .map((c) => ({
      id: typeof c.id === "string" ? c.id.trim() : "",
      nombre: c.nombre ?? "",
    }))
    .filter((c) => c.id !== "");
}

function aDatos(d: DatosBackend): EstablecimientoDatos {
  return {
    id: d.id ?? "",
    nombre: d.nombre ?? "",
    cuit: d.cuit ?? "",
    razonSocial: d.razonSocial ?? "",
    descripcion: d.descripcion ?? "",
    ubicacion: d.ubicacion ?? "",
    localidad: d.localidad ?? "",
    telefono: d.telefono ?? "",
    email: d.email ?? "",
    cvu: d.cvu ?? "",
    cultivos: aCultivos(d.cultivos),
  };
}

interface UseDatosReturn {
  datos: EstablecimientoDatos | null;
  isLoading: boolean;
  error: string | null;
  reload: () => void;
  /** Aplica localmente lo que se acaba de guardar, sin volver a pedir. */
  aplicar: (cambios: Partial<EstablecimientoDatos>) => void;
}

/**
 * GET /establecimientos/{id}. Sin `id` —la cuenta todavía no tiene ninguno o el
 * store no rehidrató— no pide nada y queda en carga: la pantalla ya distingue
 * ese caso por su cuenta.
 */
export function useEstablecimientoDatos(id: string): UseDatosReturn {
  const [datos, setDatos] = useState<EstablecimientoDatos | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    if (!id) return;
    let active = true;

    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!active) return;
      if (!user) {
        setError("Necesitás iniciar sesión para ver el establecimiento");
        setIsLoading(false);
        return;
      }
      try {
        const token = await user.getIdToken();
        const res = await apiFetch<unknown>(`${BASE}/${encodeURIComponent(id)}`, { token });
        if (!active) return;
        const env = comoEnvelope<DatosBackend>(res);
        if (!env.ok || !env.data) {
          setError(env.code ?? "No pudimos cargar los datos del establecimiento");
          return;
        }
        setDatos(aDatos(env.data));
      } catch (e) {
        if (active) setError(e instanceof Error ? e.message : "Error inesperado");
      } finally {
        if (active) setIsLoading(false);
      }
    });

    return () => {
      active = false;
      unsub();
    };
  }, [id, nonce]);

  const reload = useCallback(() => {
    setIsLoading(true);
    setError(null);
    setNonce((n) => n + 1);
  }, []);

  const aplicar = useCallback((cambios: Partial<EstablecimientoDatos>) => {
    setDatos((prev) => (prev ? { ...prev, ...cambios } : prev));
  }, []);

  return { datos, isLoading, error, reload, aplicar };
}

/* ---- Guardado ------------------------------------------------------------ */

export function useGuardarEstablecimiento() {
  const [isLoading, setIsLoading] = useState(false);

  /**
   * PUT /establecimientos/{id}. El backend tiene un único endpoint para todos
   * los datos, así que aunque la pantalla edite por bloques hay que mandar el
   * objeto entero: quien llama arma `datos` mezclando lo último conocido del
   * servidor con lo que se editó en esa sección.
   *
   * La contra de tener un solo endpoint: si dos personas editan secciones
   * distintas a la vez, la última pisa a la primera.
   */
  async function guardar(
    id: string,
    datos: EstablecimientoEditable,
  ): Promise<{ ok: boolean; code?: string }> {
    setIsLoading(true);
    try {
      const res = await conToken((token) =>
        apiFetch<unknown>(`${BASE}/${encodeURIComponent(id)}`, {
          method: "PUT",
          token,
          body: JSON.stringify(datos),
        }),
      );
      const env = comoEnvelope<unknown>(res);
      return env.ok ? { ok: true } : { ok: false, code: env.code };
    } catch (e) {
      if (e instanceof ApiError) return { ok: false, code: e.code };
      // Un 2xx sin cuerpo también cuenta como guardado (ver la baja de roles).
      if (e instanceof SyntaxError) return { ok: true };
      return { ok: false };
    } finally {
      setIsLoading(false);
    }
  }

  return { guardar, isLoading };
}

/* ---- Catálogo de cultivos ------------------------------------------------ */

/**
 * GET /tipos-cultivo: todos los cultivos que se pueden asociar. Se pide una vez
 * al abrir el modal de agregar, no al cargar la pantalla.
 */
export function useTiposCultivo(habilitado: boolean) {
  const [cultivos, setCultivos] = useState<CultivoRef[]>([]);
  // Arranca en carga si ya está habilitado: prenderlo desde el efecto sería
  // un render de más y un setState sincrónico adentro del efecto.
  const [isLoading, setIsLoading] = useState(habilitado);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!habilitado) return;
    let active = true;

    conToken((token) => apiFetch<unknown>(TIPOS_CULTIVO, { token }))
      .then((res) => {
        if (!active) return;
        const env = comoEnvelope<CultivoBackend[]>(res);
        if (!env.ok) {
          setError(env.code ?? "No pudimos cargar los cultivos");
          return;
        }
        setCultivos(aCultivos(env.data));
      })
      .catch((e: unknown) => {
        if (active) setError(e instanceof Error ? e.message : "Error inesperado");
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [habilitado]);

  return { cultivos, isLoading, error };
}
