import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

/** Opción de país para el <CountrySelect> (code = iso2 en minúsculas para la bandera). */
export interface Pais {
  code: string;
  name: string;
}

/** Forma que devuelve el backend en `data`. */
interface PaisBackend {
  nombre: string;
  iso2: string;
}

interface PaisesResponse {
  ok: boolean;
  code?: string;
  data?: PaisBackend[];
}

interface UsePaisesReturn {
  paises: Pais[];
  isLoading: boolean;
  error: string | null;
  reload: () => void;
}

/**
 * Lista de países desde el backend (GET /pais/). Endpoint público (registro),
 * así que no lleva token. Mapea { nombre, iso2 } → { name, code } para el select.
 */
export function usePaises(): UsePaisesReturn {
  const [paises, setPaises] = useState<Pais[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    let active = true;

    apiFetch<PaisesResponse>("/pais/")
      .then((res) => {
        if (!active) return;
        if (!res.ok || !res.data) {
          setError(res.code ?? "No pudimos cargar los países");
          return;
        }
        // Conservamos el iso2 tal cual (es lo que se envía al backend); el flag lo pasa a minúsculas.
        setPaises(res.data.map((p) => ({ code: p.iso2, name: p.nombre })));
      })
      .catch((e: unknown) => {
        if (active) setError(e instanceof Error ? e.message : "Error inesperado");
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => { active = false; };
  }, [nonce]);

  const reload = useCallback(() => {
    setIsLoading(true);
    setError(null);
    setNonce((n) => n + 1);
  }, []);

  return { paises, isLoading, error, reload };
}
