import { useEffect, useRef, useState } from "react";

export interface AsyncState<T> {
  data: T | null;
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

  // Siempre invocar la última versión del fetcher sin re-disparar por su identidad.
  const fetcherRef = useRef(fetcher);
  useEffect(() => { fetcherRef.current = fetcher; });

  useEffect(() => {
    let active = true;
    fetcherRef.current()
      .then((d) => { if (active) setState({ key, data: d, error: null }); })
      .catch((e: unknown) => { if (active) setState({ key, data: null, error: e instanceof Error ? e.message : "Error inesperado" }); });
    return () => { active = false; };
  }, [key]);

  const isLoading = state.key !== key;
  return {
    data: isLoading ? null : state.data,
    error: isLoading ? null : state.error,
    isLoading,
    reload: () => setNonce((n) => n + 1),
  };
}
