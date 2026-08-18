import { useAsync } from "@/hooks/useAsync";
import { ADMIN_SEED_PEOPLE, ADMIN_SEED_ROLES, ADMIN_SEED_ESTAB } from "@/data/admin";
import type { AdminEstab } from "@/types/admin";

export interface AdminResumen {
  adminCount: number;
  rolesActivos: number;
  estActivos: number;
  estSusp: number;
  suspendidos: AdminEstab[];
}

/** Resumen del estado de la plataforma. Reemplazar el mock por un fetch real. */
export function useAdminResumen() {
  return useAsync<AdminResumen>(mockFetch);
}

// MOCK — reemplazar por fetch("/api/admin/resumen")
async function mockFetch(): Promise<AdminResumen> {
  await new Promise<void>((res) => setTimeout(res, 500));
  const suspendidos = ADMIN_SEED_ESTAB.filter((e) => e.estado === "suspendido");
  return {
    adminCount: ADMIN_SEED_PEOPLE.filter((p) => p.estado === "activo").length,
    rolesActivos: ADMIN_SEED_ROLES.filter((r) => !r.baja).length,
    estActivos: ADMIN_SEED_ESTAB.filter((e) => e.estado === "activo").length,
    estSusp: suspendidos.length,
    suspendidos,
  };
}
