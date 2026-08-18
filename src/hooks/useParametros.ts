import { useState } from "react";
import { useAsync } from "@/hooks/useAsync";
import { PARAM_SEED } from "@/data/parametros";
import type { Parametros } from "@/types/parametros";

/** Lee los parámetros del sistema. Reemplazar el mock por fetch. */
export function useParametros() {
  return useAsync<Parametros>(mockFetch);
}

// MOCK — reemplazar por fetch("/api/admin/parametros")
async function mockFetch(): Promise<Parametros> {
  await new Promise<void>((res) => setTimeout(res, 500));
  return { ...PARAM_SEED };
}

// Demo: contraseña correcta para reconfirmar identidad.
const PARAM_PASS = "agrotours";

/** Reconfirma la identidad del admin antes de editar. Mock: valida la clave. */
export function useConfirmarIdentidad() {
  const [isLoading, setIsLoading] = useState(false);
  async function confirmar(pass: string): Promise<boolean> {
    setIsLoading(true);
    try {
      await new Promise<void>((res) => setTimeout(res, 600));
      // MOCK — reemplazar por POST /api/admin/reauth
      return pass === PARAM_PASS;
    } finally { setIsLoading(false); }
  }
  return { confirmar, isLoading };
}

export function useGuardarParametros() {
  const [isLoading, setIsLoading] = useState(false);
  async function guardar(_p: Parametros): Promise<void> {
    setIsLoading(true);
    try { await new Promise<void>((res) => setTimeout(res, 700)); } finally { setIsLoading(false); }
  }
  return { guardar, isLoading };
}
