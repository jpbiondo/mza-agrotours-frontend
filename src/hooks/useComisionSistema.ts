import { useCallback, useEffect, useState } from "react";
import { apiFetch, comoEnvelope } from "@/lib/api";

const PATH = "/visitantes/parametros/porcentajeComisionSistema";

/** El backend manda la fracción (`0.05`); acá viaja como porcentaje (`5`). */
async function pedir(): Promise<number> {
  const env = comoEnvelope<unknown>(await apiFetch<unknown>(PATH));
  const fraccion = env.data === null || env.data === undefined || env.data === "" ? NaN : Number(env.data);
  if (!env.ok || !Number.isFinite(fraccion)) throw new Error("No pudimos cargar la comisión");
  return Number((fraccion * 100).toFixed(2));
}

export interface UseComisionSistema {
  /** Porcentaje vigente que retiene la plataforma de cada reserva cobrada, p. ej. `5`. */
  porcentaje: number | null;
  isLoading: boolean;
  error: string | null;
  reload: () => void;
}

/**
 * GET /visitantes/parametros/porcentajeComisionSistema: el porcentaje vigente.
 * Es público (lo leen los términos para productores sin sesión), así que sale
 * sin token y no hace falta esperar a que Firebase restaure la sesión.
 */
export function useComisionSistema(): UseComisionSistema {
  const [nonce, setNonce] = useState(0);
  const [res, setRes] = useState<{ nonce: number; porcentaje: number | null; error: string | null }>(
    { nonce: -1, porcentaje: null, error: null },
  );

  useEffect(() => {
    let active = true;
    pedir()
      .then((porcentaje) => {
        if (active) setRes({ nonce, porcentaje, error: null });
      })
      .catch((e: unknown) => {
        if (active) setRes({ nonce, porcentaje: null, error: e instanceof Error ? e.message : "Error inesperado" });
      });
    return () => {
      active = false;
    };
  }, [nonce]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);
  const isLoading = res.nonce !== nonce;

  return {
    porcentaje: isLoading ? null : res.porcentaje,
    error: isLoading ? null : res.error,
    isLoading,
    reload,
  };
}
