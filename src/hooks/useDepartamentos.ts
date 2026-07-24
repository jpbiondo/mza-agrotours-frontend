import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

/** Forma de cada item que devuelve el backend. */
interface DepartamentoBackend {
  nombre: string;
}

interface UseDepartamentosReturn {
  departamentos: string[];
  isLoading: boolean;
  error: string | null;
  reload: () => void;
}

/**
 * Departamentos de Mendoza desde el backend (GET /departamentos/). El endpoint
 * devuelve una lista de { nombre }; usamos el `nombre` para el select.
 */
export function useDepartamentos(): UseDepartamentosReturn {
  const [departamentos, setDepartamentos] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    let active = true;

    apiFetch<DepartamentoBackend[]>("/departamentos/")
      .then((res) => {
        if (!active) return;
        setDepartamentos(res.map((d) => d.nombre));
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

  return { departamentos, isLoading, error, reload };
}
