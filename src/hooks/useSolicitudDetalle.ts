import { useCallback, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../firebase.config";
import { ApiError, apiFetch } from "@/lib/api";
import type {
  ArchivoSolicitud,
  EstadoSolicitud,
  SolicitudDetalle,
} from "@/types/solicitudes";

/** Archivo crudo del backend. Campos opcionales: defensivo. */
interface ArchivoBackend {
  nombre?: string;
  extension?: string;
  key?: string;
}

/** Registro crudo de GET /solicitudes-establecimiento/me/{id}. */
interface DetalleBackend {
  id?: string;
  nombreEstablecimiento?: string;
  razonSocial?: string;
  cuit?: string;
  departamento?: string;
  domicilioLegal?: string;
  email?: string;
  telefono?: string;
  cvu?: string;
  estado?: string;
  /** `unknown`: si el backend la serializa como array/objeto en vez de string, se descarta. */
  fechaHoraAlta?: unknown;
  observacion?: string;
  archivos?: ArchivoBackend[] | null;
}

interface DetalleResponse {
  ok: boolean;
  code?: string;
  data?: DetalleBackend | null;
}

interface UseSolicitudDetalleReturn {
  solicitud: SolicitudDetalle | null;
  isLoading: boolean;
  error: string | null;
  /** La solicitud no existe o no es de este usuario (404). */
  notFound: boolean;
  unauthenticated: boolean;
  reload: () => void;
}

function aArchivo(a: ArchivoBackend): ArchivoSolicitud {
  return {
    nombre: a.nombre ?? "",
    extension: (a.extension ?? "").trim().toLowerCase().replace(/^\.+/, ""),
    key: a.key ?? "",
  };
}

function aDetalle(d: DetalleBackend): SolicitudDetalle {
  return {
    id: d.id ?? "",
    nombreEstablecimiento: d.nombreEstablecimiento ?? "",
    razonSocial: d.razonSocial ?? "",
    cuit: d.cuit ?? "",
    departamento: d.departamento ?? "",
    domicilioLegal: d.domicilioLegal ?? "",
    email: d.email ?? "",
    telefono: d.telefono ?? "",
    cvu: d.cvu ?? "",
    // Se normaliza igual que en la lista: un valor fuera del enum cae a tono neutro.
    estado: String(d.estado ?? "").trim().toLowerCase() as EstadoSolicitud,
    fechaHoraAlta:
      typeof d.fechaHoraAlta === "string" && d.fechaHoraAlta.trim()
        ? d.fechaHoraAlta
        : null,
    observacion: d.observacion ?? "",
    archivos: Array.isArray(d.archivos) ? d.archivos.map(aArchivo) : [],
  };
}

/**
 * Detalle de una solicitud propia (GET /solicitudes-establecimiento/me/{id} con
 * el ID token de Firebase). Distingue el 404 del fallo técnico para poder
 * mostrar "no encontramos esa solicitud" en vez del panel de error genérico.
 */
export function useSolicitudDetalle(id: string): UseSolicitudDetalleReturn {
  const [solicitud, setSolicitud] = useState<SolicitudDetalle | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
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
        const res = await apiFetch<DetalleResponse>(
          `/solicitudes-establecimiento/me/${encodeURIComponent(id)}`,
          { token },
        );
        if (!active) return;
        if (!res.ok || !res.data) {
          // Acá `data` vacío sí es un problema: a diferencia de la lista, este
          // endpoint devuelve un único registro y sin él no hay nada que mostrar.
          setNotFound(!res.code);
          if (res.code) setError(res.code);
          return;
        }
        setSolicitud(aDetalle(res.data));
      } catch (e) {
        if (!active) return;
        if (e instanceof ApiError && e.status === 404) {
          setNotFound(true);
          return;
        }
        setError(e instanceof Error ? e.message : "Error inesperado");
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
    setNotFound(false);
    setUnauthenticated(false);
    setNonce((n) => n + 1);
  }, []);

  return { solicitud, isLoading, error, notFound, unauthenticated, reload };
}
