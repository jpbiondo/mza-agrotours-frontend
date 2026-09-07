import { useCallback, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../firebase.config";
import { ApiError, apiFetch, comoEnvelope } from "@/lib/api";
import { conToken } from "@/lib/sesion";
import type { AdminEstab, EstadoAdminEstab, EstadoEstab } from "@/types/admin";

/**
 * Moderación de establecimientos: el listado de la plataforma y las dos
 * operaciones sobre la suspensión de uno.
 *
 * Suspender y reactivar son el POST y el DELETE del mismo recurso. Las dos
 * devuelven el establecimiento **sin los contadores**, así que de la respuesta
 * se toma sólo el estado y su sello; las actividades y las reservas se
 * conservan de lo que ya tenía la pantalla.
 */
const BASE = "/admin/establecimientos";

const suspensionUrl = (id: string) => `${BASE}/${encodeURIComponent(id)}/suspension`;

/** Establecimiento crudo. Campos opcionales: defensivo. */
interface EstabBackend {
  id?: string;
  nombre?: string;
  productorLider?: string | null;
  departamento?: string | null;
  fechaAlta?: unknown;
  cantidadActividadesPublicadas?: unknown;
  cantidadReservasHistorico?: unknown;
  estado?: string;
  motivoEstado?: string | null;
  fechaEstado?: unknown;
  nombreEjecutor?: string | null;
}

function aTexto(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

function aNumero(v: unknown): number {
  return typeof v === "number" && Number.isFinite(v) ? v : 0;
}

/**
 * El backend manda el estado en mayúsculas ("ACTIVO"). Lo que no reconoce cae
 * en "activo": es el estado sin consecuencias, y la fila queda ofreciendo
 * suspender en vez de anunciar una suspensión que quizá no existe.
 */
function aEstado(v: unknown): EstadoEstab {
  return aTexto(v).toUpperCase() === "SUSPENDIDO" ? "suspendido" : "activo";
}

/** Lo único que cambia al moderar, y lo único fiable de esas dos respuestas. */
function aEstadoActual(e: EstabBackend): EstadoAdminEstab {
  return {
    estado: aEstado(e.estado),
    motivoEstado: aTexto(e.motivoEstado),
    fechaEstado: aTexto(e.fechaEstado) || null,
    // `nombreEjecutor` viaja en null cuando el cambio no lo hizo un administrador.
    ejecutorEstado: aTexto(e.nombreEjecutor),
  };
}

function aEstab(e: EstabBackend, i: number): AdminEstab {
  return {
    id: aTexto(e.id) || `sin-id-${i}`,
    nombre: aTexto(e.nombre),
    productorLider: aTexto(e.productorLider),
    departamento: aTexto(e.departamento),
    fechaAlta: aTexto(e.fechaAlta) || null,
    actividades: aNumero(e.cantidadActividadesPublicadas),
    reservas: aNumero(e.cantidadReservasHistorico),
    ...aEstadoActual(e),
  };
}

/** Alfabético: el backend no garantiza orden y la tabla no tiene columna que ordenar. */
function porNombre(a: AdminEstab, b: AdminEstab): number {
  return a.nombre.localeCompare(b.nombre, "es");
}

/* ---- Listado ------------------------------------------------------------- */

interface UseEstablecimientosAdminReturn {
  /** Siempre definido: `[]` significa "cargó y no hay ninguno". */
  establecimientos: AdminEstab[];
  isLoading: boolean;
  error: string | null;
  reload: () => void;
}

/** GET /admin/establecimientos (permiso LEER_ESTABLECIMIENTO). */
export function useEstablecimientosAdmin(): UseEstablecimientosAdminReturn {
  const [establecimientos, setEstablecimientos] = useState<AdminEstab[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    let active = true;

    // La lectura sale al montar la pantalla: `auth.currentUser` todavía puede
    // estar vacío y el pedido iría sin token.
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!active) return;
      if (!user) {
        setError("Necesitás iniciar sesión para ver los establecimientos");
        setIsLoading(false);
        return;
      }
      try {
        const token = await user.getIdToken();
        const res = await apiFetch<unknown>(BASE, { token });
        if (!active) return;
        const env = comoEnvelope<EstabBackend[]>(res);
        if (!env.ok) {
          setError(env.code ?? "No pudimos cargar los establecimientos");
          return;
        }
        // Envelope ok sin `data` es lista vacía, no error.
        setEstablecimientos(
          Array.isArray(env.data) ? env.data.map(aEstab).sort(porNombre) : [],
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
    setNonce((n) => n + 1);
  }, []);

  return { establecimientos, isLoading, error, reload };
}

/* ---- Suspensión ---------------------------------------------------------- */

export interface ResultadoModeracion {
  ok: boolean;
  /** Código de dominio del backend, para mapearlo a un mensaje propio. */
  code?: string;
  /**
   * El estado ya actualizado, con su sello. Sólo eso: la respuesta no trae los
   * contadores, y mapearla entera los pondría en cero.
   */
  estado?: EstadoAdminEstab;
}

/**
 * Suspende o reactiva un establecimiento (permiso GESTIONAR_ESTABLECIMIENTO).
 * Las dos son escrituras disparadas por el usuario, así que van con `conToken`.
 */
export function useModerarEstablecimiento() {
  const [isLoading, setIsLoading] = useState(false);

  async function mutar(
    fn: (token: string) => Promise<unknown>,
  ): Promise<ResultadoModeracion> {
    setIsLoading(true);
    try {
      const env = comoEnvelope<EstabBackend>(await conToken(fn));
      if (!env.ok) return { ok: false, code: env.code };
      return { ok: true, estado: env.data ? aEstadoActual(env.data) : undefined };
    } catch (e) {
      // El code viaja tanto en el envelope 2xx como en el ApiError de un 4xx.
      if (e instanceof ApiError) return { ok: false, code: e.code };
      // `apiFetch` sólo llega a res.json() con un 2xx: un error de parseo es un
      // 2xx sin cuerpo, o sea que la operación se hizo. Un fallo de red tira
      // TypeError antes y cae abajo.
      if (e instanceof SyntaxError) return { ok: true };
      return { ok: false };
    } finally {
      setIsLoading(false);
    }
  }

  function suspender(id: string, motivo: string) {
    return mutar((token) =>
      apiFetch<unknown>(suspensionUrl(id), {
        method: "POST",
        token,
        body: JSON.stringify({ motivo }),
      }),
    );
  }

  function reactivar(id: string) {
    return mutar((token) =>
      apiFetch<unknown>(suspensionUrl(id), { method: "DELETE", token }),
    );
  }

  return { suspender, reactivar, isLoading };
}
