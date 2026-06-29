import { useEffect, useState } from "react";
import { ADMIN_SEED_PEOPLE } from "@/data/admin";
import type { AdminPerson } from "@/types/admin";

interface ListReturn {
  data: AdminPerson[] | null;
  isLoading: boolean;
  error: string | null;
}

/** Lista los administradores del sistema. Reemplazar el mock por un fetch real. */
export function useAdministradores(): ListReturn {
  const [state, setState] = useState<{ data: AdminPerson[] | null; error: string | null; loaded: boolean }>({
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

// MOCK — reemplazar por fetch("/api/admin/administradores")
async function mockFetch(): Promise<AdminPerson[]> {
  await new Promise<void>((res) => setTimeout(res, 500));
  return ADMIN_SEED_PEOPLE.map((p) => ({ ...p }));
}

export function useGuardarAdmin() {
  const [isLoading, setIsLoading] = useState(false);
  async function guardar(_person: AdminPerson): Promise<void> {
    setIsLoading(true);
    try { await new Promise<void>((res) => setTimeout(res, 600)); } finally { setIsLoading(false); }
  }
  return { guardar, isLoading };
}

export function useEliminarAdmin() {
  const [isLoading, setIsLoading] = useState(false);
  async function eliminar(_id: string): Promise<void> {
    setIsLoading(true);
    try { await new Promise<void>((res) => setTimeout(res, 600)); } finally { setIsLoading(false); }
  }
  return { eliminar, isLoading };
}
