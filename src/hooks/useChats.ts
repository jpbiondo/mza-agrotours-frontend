import { useEffect, useState } from "react";
import { EST_CHATS, VISITOR_CHATS } from "@/data/chats";
import type { EstChat, VisitorChat } from "@/types/chats";

interface EstReturn { data: EstChat[] | null; isLoading: boolean; error: string | null; }

/** Bandeja de chats del establecimiento (lado productor). */
export function useEstChats(): EstReturn {
  const [state, setState] = useState<{ data: EstChat[] | null; error: string | null; loaded: boolean }>({ data: null, error: null, loaded: false });
  useEffect(() => {
    let active = true;
    mockEst()
      .then((d) => { if (active) setState({ data: d, error: null, loaded: true }); })
      .catch((e: unknown) => { if (active) setState({ data: null, error: e instanceof Error ? e.message : "Error inesperado", loaded: true }); });
    return () => { active = false; };
  }, []);
  return { data: state.data, error: state.error, isLoading: !state.loaded };
}

// MOCK — reemplazar por fetch("/api/panel/chats")
async function mockEst(): Promise<EstChat[]> {
  await new Promise<void>((res) => setTimeout(res, 500));
  return EST_CHATS.map((c) => ({ ...c, days: c.days.map((d) => ({ ...d, messages: [...d.messages] })) }));
}

interface VisitorReturn { data: VisitorChat[] | null; isLoading: boolean; error: string | null; }

/** Chats del visitante con los establecimientos. */
export function useVisitorChats(): VisitorReturn {
  const [state, setState] = useState<{ data: VisitorChat[] | null; error: string | null; loaded: boolean }>({ data: null, error: null, loaded: false });
  useEffect(() => {
    let active = true;
    mockVisitor()
      .then((d) => { if (active) setState({ data: d, error: null, loaded: true }); })
      .catch((e: unknown) => { if (active) setState({ data: null, error: e instanceof Error ? e.message : "Error inesperado", loaded: true }); });
    return () => { active = false; };
  }, []);
  return { data: state.data, error: state.error, isLoading: !state.loaded };
}

// MOCK — reemplazar por fetch("/api/chats")
async function mockVisitor(): Promise<VisitorChat[]> {
  await new Promise<void>((res) => setTimeout(res, 500));
  return VISITOR_CHATS.map((c) => ({ ...c, days: c.days.map((d) => ({ ...d, messages: [...d.messages] })) }));
}

/** Envía un mensaje. Resuelve ok/err para modelar el estado de envío. */
export function useEnviarMensaje() {
  const [isLoading, setIsLoading] = useState(false);
  async function enviar(_chatId: string, _text: string): Promise<{ ok: boolean }> {
    setIsLoading(true);
    try {
      await new Promise<void>((res) => setTimeout(res, 700));
      // MOCK — reemplazar por POST /api/chats/:id/mensajes
      return { ok: true };
    } finally { setIsLoading(false); }
  }
  return { enviar, isLoading };
}
