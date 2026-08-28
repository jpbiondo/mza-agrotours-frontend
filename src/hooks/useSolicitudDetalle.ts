import { useCallback, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../firebase.config";
import { ApiError, apiFetch } from "@/lib/api";
import type {
  CambioEstado,
  EstadoSolicitud,
  PruebaSolicitud,
  SolicitudDetalle,
} from "@/types/solicitudes";

/** Prueba cruda del backend. Campos opcionales: defensivo. */
interface PruebaBackend {
  nombre?: string;
  extension?: string;
  key?: string;
}

/** Paso del historial tal como llega. */
interface CambioEstadoBackend {
  estado?: string;
  fecha?: unknown;
  observaciones?: string;
  /** `null` en los cambios que nadie revisó (el alta, que nace pendiente). */
  revisor?: string | null;
}

/** Registro crudo de GET /solicitudes-establecimiento/me/{id}. */
interface DetalleBackend {
  id?: string;
  nombreEstablecimiento?: string;
  razonSocial?: string;
  cuit?: string;
  /** Grafía del backend en la lectura; en el alta el campo viaja como `descripcion`. */
  descripcionEstablecimiento?: string;
  departamento?: string;
  domicilioLegal?: string;
  email?: string;
  telefono?: string;
  cvu?: string;
  estado?: string;
  /** `unknown`: si el backend la serializa como array/objeto en vez de string, se descarta. */
  fechaHoraAlta?: unknown;
  estados?: CambioEstadoBackend[] | null;
  pruebas?: PruebaBackend[] | null;
  nombreSolicitante?: string;
  identificacionSolicitante?: string;
  emailSolicitante?: string;
  fechaHoraAltaSolicitante?: unknown;
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

/** Fecha sólo si vino como string no vacío; si no, null (ver `fmtFechaHora`). */
function aFecha(v: unknown): string | null {
  return typeof v === "string" && v.trim() ? v : null;
}

/** El backend manda el estado en mayúsculas ("PENDIENTE"); acá se normaliza. */
function aEstado(v: unknown): EstadoSolicitud {
  return String(v ?? "").trim().toLowerCase() as EstadoSolicitud;
}

function aPrueba(p: PruebaBackend): PruebaSolicitud {
  return {
    nombre: p.nombre ?? "",
    extension: (p.extension ?? "").trim().toLowerCase().replace(/^\.+/, ""),
    key: p.key ?? "",
  };
}

function aCambio(c: CambioEstadoBackend): CambioEstado {
  return {
    estado: aEstado(c.estado),
    fecha: aFecha(c.fecha),
    observaciones: c.observaciones ?? "",
    revisor: (c.revisor ?? "").trim(),
  };
}

/** Instante del cambio, o NaN si falta o no se puede parsear. */
function tsCambio(c: CambioEstado): number {
  return c.fecha ? Date.parse(c.fecha) : NaN;
}

/**
 * Historial del cambio más reciente al más antiguo. No se confía en el orden
 * del backend, y los pasos sin fecha quedan al final en el orden recibido.
 */
function porFechaDesc(a: CambioEstado, b: CambioEstado): number {
  const ta = tsCambio(a);
  const tb = tsCambio(b);
  if (Number.isNaN(ta)) return Number.isNaN(tb) ? 0 : 1;
  if (Number.isNaN(tb)) return -1;
  return tb - ta;
}

function aDetalle(d: DetalleBackend): SolicitudDetalle {
  return {
    id: d.id ?? "",
    nombreEstablecimiento: d.nombreEstablecimiento ?? "",
    razonSocial: d.razonSocial ?? "",
    cuit: d.cuit ?? "",
    descripcion: d.descripcionEstablecimiento ?? "",
    departamento: d.departamento ?? "",
    domicilioLegal: d.domicilioLegal ?? "",
    email: d.email ?? "",
    telefono: d.telefono ?? "",
    cvu: d.cvu ?? "",
    // Se normaliza igual que en la lista: un valor fuera del enum cae a tono neutro.
    estado: aEstado(d.estado),
    fechaHoraAlta: aFecha(d.fechaHoraAlta),
    estados: Array.isArray(d.estados) ? d.estados.map(aCambio).sort(porFechaDesc) : [],
    pruebas: Array.isArray(d.pruebas) ? d.pruebas.map(aPrueba) : [],
    // Sólo los manda la vista de administración; en la del visitante quedan vacíos.
    nombreSolicitante: d.nombreSolicitante ?? "",
    identificacionSolicitante: d.identificacionSolicitante ?? "",
    emailSolicitante: d.emailSolicitante ?? "",
    fechaHoraAltaSolicitante: aFecha(d.fechaHoraAltaSolicitante),
  };
}

/** Ruta del visitante: sólo devuelve solicitudes propias. */
export const BASE_MIS_SOLICITUDES = "/solicitudes-establecimiento/me";
/** Ruta del administrador: cualquier solicitud, para la cola de revisión. */
export const BASE_ADMIN_SOLICITUDES = "/solicitudes-establecimiento";

/**
 * Detalle de una solicitud con el ID token de Firebase. Distingue el 404 del
 * fallo técnico para poder mostrar "no encontramos esa solicitud" en vez del
 * panel de error genérico.
 *
 * El `base` elige el endpoint: las dos rutas devuelven el mismo DTO, así que
 * comparten el mapeo, el orden del historial y el manejo de errores.
 */
export function useSolicitudDetalle(
  id: string,
  base: string = BASE_MIS_SOLICITUDES,
): UseSolicitudDetalleReturn {
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
          `${base}/${encodeURIComponent(id)}`,
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
  }, [id, base, nonce]);

  const reload = useCallback(() => {
    setIsLoading(true);
    setError(null);
    setNotFound(false);
    setUnauthenticated(false);
    setNonce((n) => n + 1);
  }, []);

  return { solicitud, isLoading, error, notFound, unauthenticated, reload };
}
