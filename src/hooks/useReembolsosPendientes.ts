import { useCallback, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../firebase.config";
import { ApiError, apiFetch, comoEnvelope, comoPagina } from "@/lib/api";
import { leerFechaLocal } from "@/lib/format";
import { conToken } from "@/lib/sesion";
import type { ReembolsoPendiente, ResultadoReembolso } from "@/types/reembolsos";

export const REEMBOLSOS_POR_PAGINA = 10;

function rutaReembolsos(establecimientoId: string): string {
  return `/establecimientos/${encodeURIComponent(establecimientoId)}/reembolsos`;
}

/** ReembolsoGetCatalogoDTO crudo. Campos opcionales: defensivo. */
interface ReembolsoBackend {
  reembolsoId?: string;
  fechaHoraPedido?: unknown;
  montoReembolso?: unknown;
  nombreVisitante?: string;
  emailVisitante?: string;
  reservaId?: string;
  cuposReservados?: unknown;
  nombreActividad?: string;
  diaActividad?: unknown;
}

const numero = (v: unknown): number => (typeof v === "number" && Number.isFinite(v) ? v : 0);

function aReembolso(r: ReembolsoBackend, n: number): ReembolsoPendiente {
  return {
    id: r.reembolsoId ?? `sin-id-${n}`,
    fechaPedido: leerFechaLocal(r.fechaHoraPedido),
    monto: numero(r.montoReembolso),
    visitante: r.nombreVisitante ?? "",
    emailVisitante: r.emailVisitante ?? "",
    reservaId: r.reservaId ?? "",
    cupos: numero(r.cuposReservados),
    actividad: r.nombreActividad ?? "",
    diaActividad: leerFechaLocal(r.diaActividad),
  };
}

/** Sin GESTIONAR_REEMBOLSOS_PENDIENTES el backend contesta 403 sin code. */
function mensajeLista(e: unknown): string {
  if (e instanceof ApiError && e.status === 403) {
    return "Tu rol en este establecimiento no incluye gestionar reembolsos.";
  }
  return "No pudimos cargar los reembolsos pendientes.";
}

interface UseReembolsosReturn {
  /** La página pedida; `[]` significa "cargó y no hay ninguno". */
  reembolsos: ReembolsoPendiente[];
  /** Total de pendientes, no sólo los de esta página. */
  total: number;
  totalPaginas: number;
  isLoading: boolean;
  error: string | null;
  reload: () => void;
}

/**
 * Una página de los reembolsos pendientes del establecimiento. El orden (los
 * más viejos primero) es el default del backend. `pagina` es 1-based, como la
 * muestra la pantalla. Con el id vacío no pide nada.
 */
export function useReembolsosPendientes(establecimientoId: string, pagina: number): UseReembolsosReturn {
  const [nonce, setNonce] = useState(0);
  const [cargado, setCargado] = useState<{
    clave: string;
    reembolsos: ReembolsoPendiente[];
    total: number;
    totalPaginas: number;
    error: string | null;
  } | null>(null);

  const clave = establecimientoId ? `${nonce}|${establecimientoId}|${pagina}` : "";
  const alDia = !!clave && cargado?.clave === clave;

  useEffect(() => {
    if (!establecimientoId) return;
    let active = true;
    const params = new URLSearchParams({
      page: String(pagina - 1),
      size: String(REEMBOLSOS_POR_PAGINA),
    });

    const fin = (datos: Partial<Omit<NonNullable<typeof cargado>, "clave">>) =>
      setCargado({ clave, reembolsos: [], total: 0, totalPaginas: 0, error: null, ...datos });

    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!active) return;
      if (!user) {
        fin({ error: "Necesitás iniciar sesión para ver los reembolsos" });
        return;
      }
      try {
        const token = await user.getIdToken();
        const res = await apiFetch<unknown>(
          `${rutaReembolsos(establecimientoId)}/pendientes?${params}`,
          { token },
        );
        if (!active) return;
        const env = comoEnvelope<unknown>(res);
        if (!env.ok) {
          fin({ error: mensajeLista(undefined) });
          return;
        }
        const pag = comoPagina<ReembolsoBackend>(env.data);
        fin({
          reembolsos: pag.items.map(aReembolso),
          total: pag.totalElements,
          totalPaginas: pag.totalPages,
        });
      } catch (e) {
        if (active) fin({ error: mensajeLista(e) });
      }
    });

    return () => {
      active = false;
      unsub();
    };
  }, [clave, establecimientoId, pagina]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);

  return {
    reembolsos: alDia ? cargado.reembolsos : [],
    total: alDia ? cargado.total : 0,
    totalPaginas: alDia ? cargado.totalPaginas : 0,
    isLoading: !!establecimientoId && !alDia,
    error: alDia ? cargado.error : null,
    reload,
  };
}

const RESULTADOS: readonly ResultadoReembolso[] = ["REALIZADO", "EN_PROCESO", "RECHAZADO"];

/**
 * POST /establecimientos/{id}/reembolsos/{reembolsoId}/reembolsar, sin cuerpo.
 * El backend primero busca en Mercado Pago si el reembolso ya existe (el
 * productor pudo haberlo devuelto desde su panel de MP) y si no, lo pide de
 * nuevo. Los errores de dominio son `reembolsoNotFound` (404) y
 * `reembolsoNoPendiente` (409, p. ej. doble clic u otra pestaña).
 */
export function useReembolsar() {
  const [isLoading, setIsLoading] = useState(false);

  async function reembolsar(
    establecimientoId: string,
    reembolsoId: string,
  ): Promise<{ ok: true; resultado: ResultadoReembolso } | { ok: false; code?: string; status?: number }> {
    setIsLoading(true);
    try {
      const res = await conToken((token) =>
        apiFetch<unknown>(
          `${rutaReembolsos(establecimientoId)}/${encodeURIComponent(reembolsoId)}/reembolsar`,
          { method: "POST", token },
        ),
      );
      const env = comoEnvelope<{ resultado?: unknown }>(res);
      const resultado = RESULTADOS.find((r) => r === env.data?.resultado);
      if (!env.ok || !resultado) return { ok: false, code: env.code };
      return { ok: true, resultado };
    } catch (e) {
      if (e instanceof ApiError) return { ok: false, code: e.code, status: e.status };
      return { ok: false };
    } finally {
      setIsLoading(false);
    }
  }

  return { reembolsar, isLoading };
}
