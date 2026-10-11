import { useCallback, useEffect, useRef, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../firebase.config";

export interface UseAsyncConToken<T> {
  data: T | null;
  /**
   * Lo último que llegó bien, aunque sea de una clave anterior. Sirve para no
   * vaciar la pantalla mientras se pide otra cosa —otro mes del calendario—:
   * `data` vuelve a `null` en cuanto cambia la clave.
   */
  ultimo: T | null;
  isLoading: boolean;
  error: string | null;
  reload: () => void;
}

/**
 * Lectura con token que arranca al montar la pantalla. Se espera a que Firebase
 * restaure la sesión (`onAuthStateChanged`): al montar, `auth.currentUser`
 * todavía está vacío y el pedido saldría sin token.
 *
 * La carga se deriva de si el resultado guardado corresponde a la clave actual,
 * en vez de prenderla con un setState adentro del efecto —que dispara un render
 * de más y lo prohíbe la regla de hooks—. Una `clave` vacía significa que no hay
 * nada que pedir, y entonces no queda girando.
 */
export function useLecturaConToken<T>(
  clave: string,
  pedir: (token: string) => Promise<T>,
  mensajeSinSesion: string,
): UseAsyncConToken<T> {
  const [nonce, setNonce] = useState(0);
  const claveConNonce = clave ? `${nonce}|${clave}` : "";
  const [res, setRes] = useState<{ clave: string; data: T | null; error: string | null }>(
    { clave: "", data: null, error: null },
  );
  const [ultimo, setUltimo] = useState<T | null>(null);

  // Siempre invocar la última versión del fetcher sin re-disparar por su identidad.
  const pedirRef = useRef(pedir);
  useEffect(() => { pedirRef.current = pedir; });

  useEffect(() => {
    if (!claveConNonce) return;
    let active = true;

    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!active) return;
      if (!user) {
        setRes({ clave: claveConNonce, data: null, error: mensajeSinSesion });
        return;
      }
      try {
        const token = await user.getIdToken();
        const data = await pedirRef.current(token);
        if (active) {
          setRes({ clave: claveConNonce, data, error: null });
          setUltimo(data);
        }
      } catch (e) {
        if (active) setRes({ clave: claveConNonce, data: null, error: e instanceof Error ? e.message : "Error inesperado" });
      }
    });

    return () => {
      active = false;
      unsub();
    };
  }, [claveConNonce, mensajeSinSesion]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);
  const isLoading = claveConNonce !== "" && res.clave !== claveConNonce;

  return {
    data: isLoading ? null : res.data,
    ultimo,
    error: isLoading ? null : res.error,
    isLoading,
    reload,
  };
}
