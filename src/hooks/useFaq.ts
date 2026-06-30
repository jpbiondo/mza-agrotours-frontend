import { useEffect, useState } from "react";
import { FAQ_ITEMS } from "@/data/faq";
import type { FaqItem } from "@/types/catalogo";

interface ListReturn {
  data: FaqItem[] | null;
  isLoading: boolean;
  error: string | null;
}

/** Lista la base de conocimiento (FAQ). Reemplazar el mock por fetch. */
export function useFaq(): ListReturn {
  const [state, setState] = useState<{ data: FaqItem[] | null; error: string | null; loaded: boolean }>({
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

// MOCK — reemplazar por fetch("/api/admin/faq")
async function mockFetch(): Promise<FaqItem[]> {
  await new Promise<void>((res) => setTimeout(res, 500));
  return FAQ_ITEMS.map((i) => ({ ...i }));
}

export function useGuardarFaq() {
  const [isLoading, setIsLoading] = useState(false);
  async function guardar(_item: FaqItem): Promise<void> {
    setIsLoading(true);
    try { await new Promise<void>((res) => setTimeout(res, 600)); } finally { setIsLoading(false); }
  }
  return { guardar, isLoading };
}

export function useEliminarFaq() {
  const [isLoading, setIsLoading] = useState(false);
  async function eliminar(_id: string): Promise<void> {
    setIsLoading(true);
    try { await new Promise<void>((res) => setTimeout(res, 500)); } finally { setIsLoading(false); }
  }
  return { eliminar, isLoading };
}
