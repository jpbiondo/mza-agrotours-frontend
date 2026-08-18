import { useState } from "react";
import { useAsync } from "@/hooks/useAsync";
import { FAQ_ITEMS } from "@/data/faq";
import type { FaqItem } from "@/types/catalogo";

/** Lista la base de conocimiento (FAQ). Reemplazar el mock por fetch. */
export function useFaq() {
  return useAsync<FaqItem[]>(mockFetch);
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
