import { useAsync } from "@/hooks/useAsync";
import { NOTIFICACIONES } from "@/data/notificaciones";
import type { Notificacion } from "@/types/notificaciones";

/** Lista las notificaciones (ordenadas por fecha desc). Mock → fetch. */
export function useNotificaciones() {
  return useAsync<Notificacion[]>(mockFetch);
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
