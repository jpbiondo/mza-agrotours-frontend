import { useState } from "react";
import { useAsync } from "@/hooks/useAsync";
import { GCR_CULTIVOS_SEED, GCR_RECETAS_SEED } from "@/data/gestionCr";
import type { GcrCultivo, GcrReceta } from "@/types/gestionCr";

/** Lista el catálogo de cultivos (+ recetas, para contar dependencias). */
export function useGestionCultivos() {
  const { data, isLoading, error, reload } = useAsync(mockFetch);
  return { cultivos: data?.cultivos ?? null, recetas: data?.recetas ?? null, isLoading, error, reload };
}

// MOCK — reemplazar por fetch("/api/admin/cultivos")
async function mockFetch(): Promise<{ cultivos: GcrCultivo[]; recetas: GcrReceta[] }> {
  await new Promise<void>((res) => setTimeout(res, 500));
  return {
    cultivos: GCR_CULTIVOS_SEED.map((c) => ({ ...c, calendario: [...c.calendario], beneficios: [...c.beneficios] })),
    recetas: GCR_RECETAS_SEED.map((r) => ({ ...r })),
  };
}

export function useGuardarCultivo() {
  const [isLoading, setIsLoading] = useState(false);
  async function guardar(_cultivo: GcrCultivo): Promise<void> {
    setIsLoading(true);
    try { await new Promise<void>((res) => setTimeout(res, 600)); } finally { setIsLoading(false); }
  }
  return { guardar, isLoading };
}

export function useEliminarCultivo() {
  const [isLoading, setIsLoading] = useState(false);
  async function eliminar(_id: string): Promise<void> {
    setIsLoading(true);
    try { await new Promise<void>((res) => setTimeout(res, 500)); } finally { setIsLoading(false); }
  }
  return { eliminar, isLoading };
}
