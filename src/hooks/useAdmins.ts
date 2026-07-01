import { useState } from "react";
import { useAsync } from "@/hooks/useAsync";
import { ADMIN_SEED_PEOPLE } from "@/data/admin";
import type { AdminPerson } from "@/types/admin";

/** Lista los administradores del sistema. Reemplazar el mock por un fetch real. */
export function useAdministradores() {
  return useAsync<AdminPerson[]>(mockFetch);
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
