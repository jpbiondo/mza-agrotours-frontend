import { useEffect, useState } from "react";
import { SOLICITUDES_SEED } from "@/data/solicitudes";
import type { Solicitud } from "@/types/solicitudes";

interface ListReturn {
  data: Solicitud[] | null;
  isLoading: boolean;
  error: string | null;
}

/** Lista las solicitudes de alta de establecimientos. Reemplazar el mock por fetch. */
export function useSolicitudes(): ListReturn {
  const [state, setState] = useState<{ data: Solicitud[] | null; error: string | null; loaded: boolean }>({
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

// MOCK — reemplazar por fetch("/api/admin/solicitudes")
async function mockFetch(): Promise<Solicitud[]> {
  await new Promise<void>((res) => setTimeout(res, 500));
  return SOLICITUDES_SEED.map((s) => ({ ...s }));
}

/** Aprueba o rechaza una solicitud. */
export function useResolverSolicitud() {
  const [isLoading, setIsLoading] = useState(false);
  async function resolver(_id: string, _estado: "validada" | "rechazada", _observacion: string): Promise<void> {
    setIsLoading(true);
    try { await new Promise<void>((res) => setTimeout(res, 700)); } finally { setIsLoading(false); }
  }
  return { resolver, isLoading };
}
