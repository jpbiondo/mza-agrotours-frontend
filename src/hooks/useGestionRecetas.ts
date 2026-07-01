import { useEffect, useState } from "react";
import { GCR_CULTIVOS_SEED, GCR_RECETAS_SEED } from "@/data/gestionCr";
import type { GcrCultivo, GcrReceta } from "@/types/gestionCr";

interface ListReturn {
  recetas: GcrReceta[] | null;
  cultivos: GcrCultivo[] | null;
  isLoading: boolean;
  error: string | null;
}

/** Lista el recetario (+ cultivos disponibles para asociar). */
export function useGestionRecetas(): ListReturn {
  const [state, setState] = useState<{ recetas: GcrReceta[] | null; cultivos: GcrCultivo[] | null; error: string | null; loaded: boolean }>({
    recetas: null, cultivos: null, error: null, loaded: false,
  });

  useEffect(() => {
    let active = true;
    mockFetch()
      .then((d) => { if (active) setState({ recetas: d.recetas, cultivos: d.cultivos, error: null, loaded: true }); })
      .catch((e: unknown) => { if (active) setState({ recetas: null, cultivos: null, error: e instanceof Error ? e.message : "Error inesperado", loaded: true }); });
    return () => { active = false; };
  }, []);

  return { recetas: state.recetas, cultivos: state.cultivos, error: state.error, isLoading: !state.loaded };
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
