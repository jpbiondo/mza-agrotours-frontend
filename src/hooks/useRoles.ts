import { useState } from "react";
import { useAsync } from "@/hooks/useAsync";
import { ADMIN_SEED_ROLES } from "@/data/admin";
import type { AdminRole } from "@/types/admin";

/** Lista los roles de administrador. Reemplazar el mock por un fetch real. */
export function useRoles() {
  return useAsync<AdminRole[]>(mockFetch);
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
