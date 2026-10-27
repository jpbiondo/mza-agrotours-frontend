import { useEffect, useRef, useState } from "react";

export interface AsyncState<T> {
  data: T | null;
  /**
   * Lo último que llegó bien, aunque sea de deps anteriores. Sirve para no
   * vaciar la pantalla mientras se pide otra cosa —otro filtro, otra página—:
   * `data` vuelve a `null` en cuanto cambian las deps. Igual que en
   * `useLecturaConToken`.
   */
  ultimo: T | null;
  isLoading: boolean;
  error: string | null;
  /** Vuelve a ejecutar el fetcher (para el botón "Reintentar"). */
  reload: () => void;
}

/**
 * Primitiva compartida para lecturas asíncronas (mock hoy, fetch real mañana).
 * Deriva el estado de carga de una clave (deps + nonce) para no llamar
 * setState de forma sincrónica dentro del efecto.
 */
export function useAsync<T>(fetcher: () => Promise<T>, deps: unknown[] = []): AsyncState<T> {
  const [nonce, setNonce] = useState(0);
  const key = JSON.stringify(deps) + "#" + nonce;
  const [state, setState] = useState<{ key: string; data: T | null; error: string | null }>({
    key: "", data: null, error: null,
  });
  const [ultimo, setUltimo] = useState<T | null>(null);

  // Siempre invocar la última versión del fetcher sin re-disparar por su identidad.
  const fetcherRef = useRef(fetcher);
  useEffect(() => { fetcherRef.current = fetcher; });

  useEffect(() => {
    let active = true;
    fetcherRef.current()
      .then((d) => { if (active) { setState({ key, data: d, error: null }); setUltimo(d); } })
      .catch((e: unknown) => { if (active) setState({ key, data: null, error: e instanceof Error ? e.message : "Error inesperado" }); });
    return () => { active = false; };
  }, [key]);

  const isLoading = state.key !== key;
  return {
    data: isLoading ? null : state.data,
    ultimo,
    error: isLoading ? null : state.error,
    isLoading,
    reload: () => setNonce((n) => n + 1),
  };
}
