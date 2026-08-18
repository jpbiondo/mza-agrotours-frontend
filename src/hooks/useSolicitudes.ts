import { useCallback, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../firebase.config";
import { ApiError, apiFetch } from "@/lib/api";
import type { EstadoSolicitud, SolicitudAdminItem } from "@/types/solicitudes";

const BASE = "/solicitudes-establecimiento";

/** Item crudo del listado. Campos opcionales: defensivo. */
interface ItemBackend {
  id?: string;
  nombreEstablecimiento?: string;
  fechaHoraAlta?: unknown;
  estado?: string;
  departamento?: string;
  nombreSolicitante?: string;
}

interface ListadoResponse {
  ok: boolean;
  code?: string;
  data?: ItemBackend[] | null;
}

function aItem(s: ItemBackend, i: number): SolicitudAdminItem {
  return {
    id: s.id ?? `sin-id-${i}`,
    nombreEstablecimiento: s.nombreEstablecimiento ?? "",
    // El backend manda el estado en mayúsculas ("PENDIENTE").
    estado: String(s.estado ?? "")
      .trim()
      .toLowerCase() as EstadoSolicitud,
    fechaHoraAlta:
      typeof s.fechaHoraAlta === "string" && s.fechaHoraAlta.trim()
        ? s.fechaHoraAlta
        : null,
    departamento: s.departamento ?? "",
    nombreSolicitante: s.nombreSolicitante ?? "",
  };
}

/** Instante del alta, o NaN si falta o no se puede parsear. */
function ts(s: SolicitudAdminItem): number {
  return s.fechaHoraAlta ? Date.parse(s.fechaHoraAlta) : NaN;
}

/** Más recientes primero; las que no traen fecha van al final. */
function porFechaDesc(a: SolicitudAdminItem, b: SolicitudAdminItem): number {
  const ta = ts(a);
  const tb = ts(b);
  if (Number.isNaN(ta)) return Number.isNaN(tb) ? 0 : 1;
  if (Number.isNaN(tb)) return -1;
  return tb - ta;
}

interface UseSolicitudesReturn {
  /** Siempre definido: `[]` significa "cargó y no hay ninguna". */
  solicitudes: SolicitudAdminItem[];
  isLoading: boolean;
  error: string | null;
  reload: () => void;
}

/** Cola de revisión: todas las solicitudes de alta (GET /solicitudes-establecimiento/). */
export function useSolicitudes(): UseSolicitudesReturn {
  const [solicitudes, setSolicitudes] = useState<SolicitudAdminItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    let active = true;

    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!active) return;
      if (!user) {
        setError("Necesitás iniciar sesión para ver las solicitudes");
        setIsLoading(false);
        return;
      }
      try {
        const token = await user.getIdToken();
        const res = await apiFetch<ListadoResponse>(`${BASE}/`, { token });
        if (!active) return;
        if (!res.ok) {
          setError(res.code ?? "No pudimos cargar las solicitudes");
          return;
        }
        // Envelope ok sin `data` es lista vacía, no error.
        setSolicitudes(
          Array.isArray(res.data) ? res.data.map(aItem).sort(porFechaDesc) : [],
        );
      } catch (e) {
        if (active)
          setError(e instanceof Error ? e.message : "Error inesperado");
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

  return { solicitudes, isLoading, error, reload };
}

/* ---- Resolución ---------------------------------------------------------- */

/** Estado al que puede llevarla el administrador. */
export type Resolucion = "VALIDADA" | "RECHAZADA";

export function useResolverSolicitud() {
  const [isLoading, setIsLoading] = useState(false);

  /**
   * POST /solicitudes-establecimiento/{id} con la decisión y la observación.
   * Devuelve la solicitud actualizada, que acá no hace falta: la pantalla
   * vuelve al listado y lo recarga.
   */
  async function resolver(
    solicitudId: string,
    estado: Resolucion,
    observacion: string,
  ): Promise<{ ok: boolean; code?: string }> {
    setIsLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) return { ok: false };
      const token = await user.getIdToken();
      const res = await apiFetch<{ ok: boolean; code?: string }>(
        `${BASE}/observar/${encodeURIComponent(solicitudId)}`,
        {
          method: "POST",
          token,
          body: JSON.stringify({ estado, observacion }),
        },
      );
      return res.ok ? { ok: true } : { ok: false, code: res.code };
    } catch (e) {
      if (e instanceof ApiError) return { ok: false, code: e.code };
      return { ok: false };
    } finally {
      setIsLoading(false);
    }
  }

  return { resolver, isLoading };
}
