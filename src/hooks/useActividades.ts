import { useState } from "react";
import { useAsync } from "@/hooks/useAsync";
import { ACTIVIDADES_PROD } from "@/data/actividades-prod";
import type { ActividadProd, EstadoActividad } from "@/types/actividad-prod";

/** Lista las actividades del establecimiento activo. Reemplazar el mock por fetch. */
export function useActividades(fincaId: string) {
  return useAsync<ActividadProd[]>(() => mockFetch(fincaId), [fincaId]);
}

// MOCK — reemplazar por fetch(`/api/productor/${fincaId}/actividades`)
async function mockFetch(_fincaId: string): Promise<ActividadProd[]> {
  await new Promise<void>((res) => setTimeout(res, 600));
  return ACTIVIDADES_PROD;
}

/** Mutaciones sobre una actividad: dar de baja y cambiar estado de publicación. */
export function useActividadAcciones() {
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function darDeBaja(id: string): Promise<void> {
    setPendingId(id);
    try { await mockDarDeBaja(id); } finally { setPendingId(null); }
  }

  async function cambiarEstado(id: string, nuevo: EstadoActividad): Promise<void> {
    setPendingId(id);
    try { await mockCambiarEstado(id, nuevo); } finally { setPendingId(null); }
  }

  return { darDeBaja, cambiarEstado, pendingId };
}

// MOCK — reemplazar por fetch(`/api/actividades/${id}/baja`, { method: "POST" })
async function mockDarDeBaja(_id: string): Promise<void> {
  await new Promise<void>((res) => setTimeout(res, 700));
}

// MOCK — reemplazar por fetch(`/api/actividades/${id}`, { method: "PATCH", body: { estado } })
async function mockCambiarEstado(_id: string, _nuevo: EstadoActividad): Promise<void> {
  await new Promise<void>((res) => setTimeout(res, 500));
}
