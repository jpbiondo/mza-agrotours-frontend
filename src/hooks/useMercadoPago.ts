import { useCallback, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../firebase.config";
import { ApiError, apiFetch, comoEnvelope } from "@/lib/api";
import { conToken } from "@/lib/sesion";
import type { CuentaMercadoPago, EstadoCobro } from "@/types/datos";

function rutaMercadoPago(establecimientoId: string): string {
  return `/establecimientos/${encodeURIComponent(establecimientoId)}/mercadopago`;
}

/** DTOCuentaMercadoPagoEstado crudo. Campos opcionales: defensivo. */
interface CuentaBackend {
  vinculada?: unknown;
  estadoCobro?: unknown;
  fechaHoraVinculacion?: unknown;
  fechaHoraExpiracionToken?: unknown;
}

const ESTADOS: readonly EstadoCobro[] = ["HABILITADO", "SIN_CUENTA", "TOKEN_VENCIDO"];

/**
 * Un valor desconocido cae a SIN_CUENTA: lo peor que puede pasar es ofrecer
 * vincular una cuenta que ya estaba, y no decir "habilitado" cuando no lo está.
 */
function aEstado(v: unknown): EstadoCobro {
  return ESTADOS.find((e) => e === v) ?? "SIN_CUENTA";
}

const aFecha = (v: unknown) => (typeof v === "string" && v ? v : null);

function aCuenta(d: CuentaBackend): CuentaMercadoPago {
  return {
    vinculada: d.vinculada === true,
    estadoCobro: aEstado(d.estadoCobro),
    fechaHoraVinculacion: aFecha(d.fechaHoraVinculacion),
    fechaHoraExpiracionToken: aFecha(d.fechaHoraExpiracionToken),
  };
}

/** Sólo el productor titular la puede ver; un establecimiento inexistente también da 403. */
const SIN_ACCESO = "accessDenied";

function mensajeError(code?: string): string {
  if (code === SIN_ACCESO) return "No tenés permiso para ver la cuenta de cobro de este establecimiento.";
  return "No pudimos consultar la cuenta de Mercado Pago.";
}

interface UseCuentaReturn {
  cuenta: CuentaMercadoPago | null;
  isLoading: boolean;
  error: string | null;
  reload: () => void;
}

/**
 * GET /establecimientos/{id}/mercadopago: si el establecimiento puede cobrar.
 * Con el id vacío no pide nada. La carga se deriva de la clave de la petición,
 * como en `useRoles`, para no ver un frame la cuenta de la finca anterior al
 * cambiar de establecimiento.
 */
export function useCuentaMercadoPago(establecimientoId: string): UseCuentaReturn {
  const [nonce, setNonce] = useState(0);
  const [cargado, setCargado] = useState<{
    clave: string;
    cuenta: CuentaMercadoPago | null;
    error: string | null;
  } | null>(null);

  const clave = establecimientoId ? `${nonce}|${establecimientoId}` : "";
  const alDia = !!clave && cargado?.clave === clave;

  useEffect(() => {
    if (!establecimientoId) return;
    let active = true;

    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!active) return;
      const fin = (d: { cuenta?: CuentaMercadoPago; error?: string }) =>
        setCargado({ clave, cuenta: d.cuenta ?? null, error: d.error ?? null });

      if (!user) {
        fin({ error: "Necesitás iniciar sesión para ver la cuenta de cobro" });
        return;
      }
      try {
        const token = await user.getIdToken();
        const res = await apiFetch<unknown>(rutaMercadoPago(establecimientoId), { token });
        if (!active) return;
        const env = comoEnvelope<CuentaBackend>(res);
        if (!env.ok || !env.data) {
          fin({ error: mensajeError(env.code) });
          return;
        }
        fin({ cuenta: aCuenta(env.data) });
      } catch (e) {
        if (active) fin({ error: mensajeError(e instanceof ApiError ? e.code : undefined) });
      }
    });

    return () => {
      active = false;
      unsub();
    };
  }, [clave, establecimientoId]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);

  return {
    cuenta: alDia ? cargado.cuenta : null,
    isLoading: !!establecimientoId && !alDia,
    error: alDia ? cargado.error : null,
    reload,
  };
}

/**
 * GET /establecimientos/{id}/mercadopago/vincular devuelve la URL de
 * autorización de Mercado Pago, y se navega a ella entera (no es un fetch).
 * El `state` que lleva vence a los 10 minutos, así que se pide recién al hacer
 * clic. Mercado Pago vuelve al callback del backend, y éste redirige a
 * `/mercadopago/vinculacion` con el resultado.
 *
 * Si sale bien la página se va, así que `isLoading` queda en `true` a propósito:
 * el botón no se rehabilita durante la navegación.
 */
export function useVincularMercadoPago() {
  const [isLoading, setIsLoading] = useState(false);

  async function vincular(establecimientoId: string): Promise<{ ok: boolean; code?: string }> {
    setIsLoading(true);
    try {
      const res = await conToken((token) =>
        apiFetch<unknown>(`${rutaMercadoPago(establecimientoId)}/vincular`, { token }),
      );
      const env = comoEnvelope<unknown>(res);
      if (env.ok && typeof env.data === "string" && env.data) {
        window.location.href = env.data;
        return { ok: true };
      }
      setIsLoading(false);
      return { ok: false, code: env.code };
    } catch (e) {
      setIsLoading(false);
      if (e instanceof ApiError) return { ok: false, code: e.code };
      return { ok: false };
    }
  }

  return { vincular, isLoading };
}
