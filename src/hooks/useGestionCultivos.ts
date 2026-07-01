import { useEffect, useState } from "react";
import { GCR_CULTIVOS_SEED, GCR_RECETAS_SEED } from "@/data/gestionCr";
import type { GcrCultivo, GcrReceta } from "@/types/gestionCr";

interface ListReturn {
  cultivos: GcrCultivo[] | null;
  recetas: GcrReceta[] | null;
  isLoading: boolean;
  error: string | null;
}

/** Lista el catálogo de cultivos (+ recetas, para contar dependencias). */
export function useGestionCultivos(): ListReturn {
  const [state, setState] = useState<{ cultivos: GcrCultivo[] | null; recetas: GcrReceta[] | null; error: string | null; loaded: boolean }>({
    cultivos: null, recetas: null, error: null, loaded: false,
  });

  useEffect(() => {
    let active = true;
    mockFetch()
      .then((d) => { if (active) setState({ cultivos: d.cultivos, recetas: d.recetas, error: null, loaded: true }); })
      .catch((e: unknown) => { if (active) setState({ cultivos: null, recetas: null, error: e instanceof Error ? e.message : "Error inesperado", loaded: true }); });
    return () => { active = false; };
  }, []);

  return { cultivos: state.cultivos, recetas: state.recetas, error: state.error, isLoading: !state.loaded };
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
