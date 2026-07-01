import { useEffect, useState } from "react";
import { NOTIFICACIONES } from "@/data/notificaciones";
import type { Notificacion } from "@/types/notificaciones";

interface ListReturn {
  data: Notificacion[] | null;
  isLoading: boolean;
  error: string | null;
}

/** Lista las notificaciones (ordenadas por fecha desc). Mock → fetch. */
export function useNotificaciones(): ListReturn {
  const [state, setState] = useState<{ data: Notificacion[] | null; error: string | null; loaded: boolean }>({
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

// MOCK — reemplazar por fetch("/api/notificaciones")
async function mockFetch(): Promise<Notificacion[]> {
  await new Promise<void>((res) => setTimeout(res, 450));
  return NOTIFICACIONES.slice().sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime());
}

/** Marca notificaciones como leídas (una o todas). */
export function useMarcarLeidas() {
  async function marcar(_ids: string[]): Promise<void> {
    // MOCK — reemplazar por POST /api/notificaciones/leidas
    await new Promise<void>((res) => setTimeout(res, 200));
  }
  return { marcar };
}
