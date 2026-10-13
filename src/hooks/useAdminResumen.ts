import { useCallback, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../firebase.config";
import { apiFetch, comoEnvelope } from "@/lib/api";

const RESUMEN = "/admin/panel/resumen";

/** Establecimiento suspendido, tal como lo lista el resumen: sólo para nombrarlo. */
export interface EstabSuspendido {
  id: string;
  nombre: string;
}

export interface AdminResumen {
  adminCount: number;
  rolesActivos: number;
  estActivos: number;
  estSusp: number;
  suspendidos: EstabSuspendido[];
}

/** Resumen crudo. Campos opcionales: defensivo. */
interface ResumenBackend {
  administradoresActivos?: unknown;
  rolesActivos?: unknown;
  establecimientosActivos?: unknown;
  establecimientosSuspendidos?: unknown;
  suspendidos?: unknown;
}

interface SuspendidoBackend {
  id?: string;
  nombre?: string;
}

function aNumero(v: unknown): number {
  return typeof v === "number" && Number.isFinite(v) ? v : 0;
}

function aSuspendidos(v: unknown): EstabSuspendido[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((e): e is SuspendidoBackend => !!e && typeof e === "object")
    .map((e, i) => ({
      id: typeof e.id === "string" && e.id ? e.id : `sin-id-${i}`,
      nombre: typeof e.nombre === "string" ? e.nombre.trim() : "",
    }))
    .filter((e) => e.nombre !== "")
    .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
}

function aResumen(r: ResumenBackend): AdminResumen {
  return {
    adminCount: aNumero(r.administradoresActivos),
    rolesActivos: aNumero(r.rolesActivos),
    estActivos: aNumero(r.establecimientosActivos),
    estSusp: aNumero(r.establecimientosSuspendidos),
    suspendidos: aSuspendidos(r.suspendidos),
  };
}

interface UseAdminResumenReturn {
  data: AdminResumen | null;
  isLoading: boolean;
  error: string | null;
  reload: () => void;
}

/** GET /admin/panel/resumen: el estado general de la plataforma. */
export function useAdminResumen(): UseAdminResumenReturn {
  const [nonce, setNonce] = useState(0);
  /**
   * Lo cargado, con el nonce de la petición que lo trajo: mientras no coincida
   * con el actual, la pantalla está cargando. Así no hace falta prender la
   * carga con un setState dentro del efecto.
   */
  const [cargado, setCargado] = useState<{
    nonce: number;
    data: AdminResumen | null;
    error: string | null;
  } | null>(null);

  const alDia = cargado?.nonce === nonce;

  useEffect(() => {
    let active = true;
    const fin = (datos: { data?: AdminResumen; error?: string }) =>
      setCargado({ nonce, data: datos.data ?? null, error: datos.error ?? null });

    // La lectura sale al montar la pantalla: `auth.currentUser` todavía puede
    // estar vacío y el pedido iría sin token.
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!active) return;
      if (!user) {
        fin({ error: "Necesitás iniciar sesión para ver el resumen" });
        return;
      }
      try {
        const token = await user.getIdToken();
        const res = await apiFetch<unknown>(RESUMEN, { token });
        if (!active) return;
        const env = comoEnvelope<ResumenBackend>(res);
        if (!env.ok || !env.data) {
          fin({ error: env.code ?? "No pudimos cargar el resumen" });
          return;
        }
        fin({ data: aResumen(env.data) });
      } catch (e) {
        if (active) fin({ error: e instanceof Error ? e.message : "Error inesperado" });
      }
    });

    return () => {
      active = false;
      unsub();
    };
  }, [nonce]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);

  return {
    data: alDia ? cargado.data : null,
    isLoading: !alDia,
    error: alDia ? cargado.error : null,
    reload,
  };
}
