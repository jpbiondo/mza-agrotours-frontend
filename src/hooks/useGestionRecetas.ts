import { useState } from "react";
import { useAsync } from "@/hooks/useAsync";
import { GCR_CULTIVOS_SEED, GCR_RECETAS_SEED } from "@/data/gestionCr";
import type { GcrCultivo, GcrReceta } from "@/types/gestionCr";

/** Lista el recetario (+ cultivos disponibles para asociar). */
export function useGestionRecetas() {
  const { data, isLoading, error, reload } = useAsync(mockFetch);
  return { recetas: data?.recetas ?? null, cultivos: data?.cultivos ?? null, isLoading, error, reload };
}

// MOCK — reemplazar por fetch("/api/admin/recetas")
async function mockFetch(): Promise<{ recetas: GcrReceta[]; cultivos: GcrCultivo[] }> {
  await new Promise<void>((res) => setTimeout(res, 500));
  return {
    recetas: GCR_RECETAS_SEED.map((r) => ({ ...r, cultivos: [...r.cultivos], ingredientes: [...r.ingredientes], pasos: [...r.pasos] })),
    cultivos: GCR_CULTIVOS_SEED.map((c) => ({ ...c })),
  };
}

export function useGuardarReceta() {
  const [isLoading, setIsLoading] = useState(false);
  async function guardar(_receta: GcrReceta): Promise<void> {
    setIsLoading(true);
    try { await new Promise<void>((res) => setTimeout(res, 600)); } finally { setIsLoading(false); }
  }
  return { guardar, isLoading };
}

export function useEliminarReceta() {
  const [isLoading, setIsLoading] = useState(false);
  async function eliminar(_id: string): Promise<void> {
    setIsLoading(true);
    try { await new Promise<void>((res) => setTimeout(res, 500)); } finally { setIsLoading(false); }
  }
  return { eliminar, isLoading };
}
