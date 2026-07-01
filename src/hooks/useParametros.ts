import { useEffect, useState } from "react";
import { PARAM_SEED } from "@/data/parametros";
import type { Parametros } from "@/types/parametros";

interface ListReturn {
  data: Parametros | null;
  isLoading: boolean;
  error: string | null;
}

/** Lee los parámetros del sistema. Reemplazar el mock por fetch. */
export function useParametros(): ListReturn {
  const [state, setState] = useState<{ data: Parametros | null; error: string | null; loaded: boolean }>({
    data: null, error: null, loaded: false,
  });

  useEffect(() => {
    let active = true;
    mockFetch()
      .then((d) => { if (active) setState({ data: d, error: null, loaded: true }); })
      .catch((e: unknown) => { if (active) setState({ data: null, error: e instanceof Error ? e.message : "Error inesperado", loaded: true }); });
    return () => { active = false; };
  }, []);

  return { data: state.data, error: state.error, isLoading: !state.loaded };
}

// MOCK — reemplazar por fetch("/api/admin/parametros")
async function mockFetch(): Promise<Parametros> {
  await new Promise<void>((res) => setTimeout(res, 500));
  return { ...PARAM_SEED };
}

// Demo: contraseña correcta para reconfirmar identidad.
const PARAM_PASS = "agrotours";

/** Reconfirma la identidad del admin antes de editar. Mock: valida la clave. */
export function useConfirmarIdentidad() {
  const [isLoading, setIsLoading] = useState(false);
  async function confirmar(pass: string): Promise<boolean> {
    setIsLoading(true);
    try {
      await new Promise<void>((res) => setTimeout(res, 600));
      // MOCK — reemplazar por POST /api/admin/reauth
      return pass === PARAM_PASS;
    } finally { setIsLoading(false); }
  }
  return { confirmar, isLoading };
}

export function useGuardarParametros() {
  const [isLoading, setIsLoading] = useState(false);
  async function guardar(_p: Parametros): Promise<void> {
    setIsLoading(true);
    try { await new Promise<void>((res) => setTimeout(res, 700)); } finally { setIsLoading(false); }
  }
  return { guardar, isLoading };
}
