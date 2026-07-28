import { useCallback, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../firebase.config";
import { apiFetch } from "@/lib/api";
import type { EstadoSolicitud, SolicitudResumen } from "@/types/solicitudes";

/** Item crudo de GET /solicitudes-establecimiento/me. Campos opcionales: defensivo. */
interface SolicitudBackend {
  id?: string;
  nombreEstablecimiento?: string;
  razonSocial?: string;
  cuit?: string;
  domicilioLegal?: string;
  estado?: string;
  fechaCreacion?: string | null;
}

interface MisSolicitudesResponse {
  ok: boolean;
  code?: string;
  data?: SolicitudBackend[] | null;
}

interface UseMisSolicitudesReturn {
  /** Siempre definido. `[]` significa "cargó y no hay ninguna", nunca "todavía no cargó". */
  solicitudes: SolicitudResumen[];
  isLoading: boolean;
  error: string | null;
  /** No hay sesión de Firebase: la pantalla debe redirigir a /acceso. */
  unauthenticated: boolean;
  reload: () => void;
}

function aResumen(s: SolicitudBackend, i: number): SolicitudResumen {
  return {
    // El `id` sólo faltaría si el backend cambiara el contrato; el fallback evita
    // keys duplicadas en React en ese caso.
    id: s.id ?? `sin-id-${i}`,
    nombreEstablecimiento: s.nombreEstablecimiento ?? "",
    razonSocial: s.razonSocial ?? "",
    cuit: s.cuit ?? "",
    domicilioLegal: s.domicilioLegal ?? "",
    // El contrato dice minúsculas ("pendiente" | "validada" | "rechazada");
    // se normaliza por si el enum del backend se serializara en mayúsculas.
    // Un valor desconocido no rompe: la pantalla cae a un tono neutro.
    estado: String(s.estado ?? "").trim().toLowerCase() as EstadoSolicitud,
    // Se guarda el ISO crudo y se formatea al renderizar. Vacío → null para que
    // `fmtFechaHora` muestre "—" en vez de "NaN/NaN/NaN".
    fechaCreacion: s.fechaCreacion?.trim() ? s.fechaCreacion : null,
  };
}

/** Instante de la fecha, o NaN si falta o no se puede parsear. */
function ts(s: SolicitudResumen): number {
  return s.fechaCreacion ? Date.parse(s.fechaCreacion) : NaN;
}

/**
 * Más recientes primero. Se compara por instante y no lexicográficamente: dos
 * ISO con distinto offset no ordenan bien como texto. Las que no traen fecha
 * (o la traen inválida) van al final, en el orden del backend.
 */
function porFechaDesc(a: SolicitudResumen, b: SolicitudResumen): number {
  const ta = ts(a);
  const tb = ts(b);
  if (Number.isNaN(ta)) return Number.isNaN(tb) ? 0 : 1;
  if (Number.isNaN(tb)) return -1;
  return tb - ta;
}

/**
 * Solicitudes de alta de establecimiento del usuario en sesión
 * (GET /solicitudes-establecimiento/me con el ID token de Firebase).
 * Protege la pantalla: sin sesión marca `unauthenticated`.
 */
export function useMisSolicitudes(): UseMisSolicitudesReturn {
  const [solicitudes, setSolicitudes] = useState<SolicitudResumen[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unauthenticated, setUnauthenticated] = useState(false);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    let active = true;

    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!active) return;
      if (!user) {
        setUnauthenticated(true);
        setIsLoading(false);
        return;
      }
      try {
        const token = await user.getIdToken();
        const res = await apiFetch<MisSolicitudesResponse>(
          "/solicitudes-establecimiento/me",
          { token },
        );
        if (!active) return;
        if (!res.ok) {
          setError(res.code ?? "No pudimos cargar tus solicitudes");
          return;
        }
        // `ok` sin `data` (o con `data: null`) es una lista vacía, NO un error:
        // el estado vacío tiene que ser distinguible de un fallo de carga.
        setSolicitudes(
          Array.isArray(res.data) ? res.data.map(aResumen).sort(porFechaDesc) : [],
        );
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
  }, [nonce]);

  const reload = useCallback(() => {
    setIsLoading(true);
    setError(null);
    setUnauthenticated(false);
    setNonce((n) => n + 1);
  }, []);

  return { solicitudes, isLoading, error, unauthenticated, reload };
}
