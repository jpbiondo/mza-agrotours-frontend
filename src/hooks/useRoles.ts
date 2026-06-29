import { useEffect, useState } from "react";
import { ADMIN_SEED_ROLES } from "@/data/admin";
import type { AdminRole } from "@/types/admin";

interface ListReturn {
  data: AdminRole[] | null;
  isLoading: boolean;
  error: string | null;
}

/** Lista los roles de administrador. Reemplazar el mock por un fetch real. */
export function useRoles(): ListReturn {
  const [state, setState] = useState<{ data: AdminRole[] | null; error: string | null; loaded: boolean }>({
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

// MOCK — reemplazar por fetch("/api/admin/roles")
async function mockFetch(): Promise<AdminRole[]> {
  await new Promise<void>((res) => setTimeout(res, 500));
  return ADMIN_SEED_ROLES.map((r) => ({ ...r }));
}

export function useGuardarRol() {
  const [isLoading, setIsLoading] = useState(false);
  async function guardar(_role: AdminRole): Promise<void> {
    setIsLoading(true);
    try { await new Promise<void>((res) => setTimeout(res, 600)); } finally { setIsLoading(false); }
  }
  return { guardar, isLoading };
}

export function useDarBajaRol() {
  const [isLoading, setIsLoading] = useState(false);
  async function darBaja(_id: string): Promise<void> {
    setIsLoading(true);
    try { await new Promise<void>((res) => setTimeout(res, 600)); } finally { setIsLoading(false); }
  }
  return { darBaja, isLoading };
}
