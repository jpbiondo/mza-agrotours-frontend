import { useEffect, useState } from "react";
import { CUENTA_ACTUAL, perfilInicial, fechaHoraBaja } from "@/data/cuenta";
import type { CuentaSesion, Perfil } from "@/data/cuenta";

interface PerfilReturn {
  cuenta: CuentaSesion | null;
  perfil: Perfil | null;
  isLoading: boolean;
  error: string | null;
}

/** Carga la cuenta en sesión y su perfil. Reemplazar el mock por fetch. */
export function usePerfil(): PerfilReturn {
  const [state, setState] = useState<{ cuenta: CuentaSesion | null; perfil: Perfil | null; error: string | null; loaded: boolean }>({
    cuenta: null, perfil: null, error: null, loaded: false,
  });

  useEffect(() => {
    let active = true;
    mockFetch()
      .then((d) => { if (active) setState({ cuenta: d.cuenta, perfil: d.perfil, error: null, loaded: true }); })
      .catch((e: unknown) => { if (active) setState({ cuenta: null, perfil: null, error: e instanceof Error ? e.message : "Error inesperado", loaded: true }); });
    return () => { active = false; };
  }, []);

  return { cuenta: state.cuenta, perfil: state.perfil, error: state.error, isLoading: !state.loaded };
}

// MOCK — reemplazar por fetch("/api/cuenta")
async function mockFetch(): Promise<{ cuenta: CuentaSesion; perfil: Perfil }> {
  await new Promise<void>((res) => setTimeout(res, 500));
  return { cuenta: CUENTA_ACTUAL, perfil: perfilInicial(CUENTA_ACTUAL) };
}

/** Guarda los datos del perfil. Simula un fallo de servidor opcional. */
export function useGuardarPerfil() {
  const [isLoading, setIsLoading] = useState(false);
  async function guardar(_perfil: Perfil): Promise<{ ok: boolean; code?: string }> {
    setIsLoading(true);
    try {
      await new Promise<void>((res) => setTimeout(res, 800));
      // MOCK — reemplazar por PUT /api/cuenta; devolver { ok:false, code } en error
      return { ok: true };
    } finally { setIsLoading(false); }
  }
  return { guardar, isLoading };
}

/** Procesa la baja de la cuenta (comunicación con backend). */
export function useEliminarCuenta() {
  const [isLoading, setIsLoading] = useState(false);
  async function procesar(): Promise<{ ok: boolean; ts: string | null }> {
    setIsLoading(true);
    try {
      await new Promise<void>((res) => setTimeout(res, 1400));
      // MOCK — reemplazar por DELETE /api/cuenta; en error devolver { ok:false, ts:null }
      return { ok: true, ts: fechaHoraBaja() };
    } finally { setIsLoading(false); }
  }
  return { procesar, isLoading };
}
