import { useEffect, useState } from "react";
import { INVITACIONES } from "@/data/invitaciones";
import type { EstadoInvitacion, Invitacion } from "@/types/invitaciones";

interface Return {
  data: Invitacion | null;
  notFound: boolean;
  isLoading: boolean;
  error: string | null;
}

/** Busca la invitación por id (o la primera si no se pasa). Mock → fetch. */
export function useInvitacion(id?: string): Return {
  const [state, setState] = useState<{ data: Invitacion | null; notFound: boolean; error: string | null; loaded: boolean }>({
    data: null, notFound: false, error: null, loaded: false,
  });

  useEffect(() => {
    let active = true;
    mockFetch(id)
      .then((d) => { if (active) setState({ data: d, notFound: !d, error: null, loaded: true }); })
      .catch((e: unknown) => { if (active) setState({ data: null, notFound: false, error: e instanceof Error ? e.message : "Error inesperado", loaded: true }); });
    return () => { active = false; };
  }, [id]);

  return { data: state.data, notFound: state.notFound, error: state.error, isLoading: !state.loaded };
}

// MOCK — reemplazar por fetch(`/api/invitaciones/${id}`)
async function mockFetch(id?: string): Promise<Invitacion | null> {
  await new Promise<void>((res) => setTimeout(res, 450));
  const inv = id ? INVITACIONES.find((i) => i.id === id) : INVITACIONES[0];
  return inv ? { ...inv } : null;
}

/** Acepta o rechaza la invitación. */
export function useResponderInvitacion() {
  const [isLoading, setIsLoading] = useState(false);
  async function responder(_id: string, _estado: EstadoInvitacion): Promise<void> {
    setIsLoading(true);
    try { await new Promise<void>((res) => setTimeout(res, 700)); } finally { setIsLoading(false); }
  }
  return { responder, isLoading };
}
