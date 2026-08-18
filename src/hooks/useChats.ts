import { useState } from "react";
import { useAsync } from "@/hooks/useAsync";
import { EST_CHATS, VISITOR_CHATS } from "@/data/chats";
import type { EstChat, VisitorChat } from "@/types/chats";

/** Bandeja de chats del establecimiento (lado productor). */
export function useEstChats() {
  return useAsync<EstChat[]>(mockEst);
}

// MOCK — reemplazar por fetch("/api/panel/chats")
async function mockEst(): Promise<EstChat[]> {
  await new Promise<void>((res) => setTimeout(res, 500));
  return EST_CHATS.map((c) => ({ ...c, days: c.days.map((d) => ({ ...d, messages: [...d.messages] })) }));
}

/** Chats del visitante con los establecimientos. */
export function useVisitorChats() {
  return useAsync<VisitorChat[]>(mockVisitor);
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
