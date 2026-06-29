import { useEffect, useState } from "react";
import { ADMIN_SEED_PEOPLE, ADMIN_SEED_ROLES, ADMIN_SEED_ESTAB } from "@/data/admin";
import type { AdminEstab } from "@/types/admin";

export interface AdminResumen {
  adminCount: number;
  rolesActivos: number;
  estActivos: number;
  estSusp: number;
  suspendidos: AdminEstab[];
}

interface UseAdminResumenReturn {
  data: AdminResumen | null;
  isLoading: boolean;
  error: string | null;
}

/** Resumen del estado de la plataforma. Reemplazar el mock por un fetch real. */
export function useAdminResumen(): UseAdminResumenReturn {
  const [state, setState] = useState<{ data: AdminResumen | null; error: string | null; loaded: boolean }>({
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
