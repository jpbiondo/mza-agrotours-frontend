import { useState } from "react";
import { useAsync } from "@/hooks/useAsync";
import { CUENTA_ACTUAL, perfilInicial, fechaHoraBaja } from "@/data/cuenta";
import type { CuentaSesion, Perfil } from "@/data/cuenta";

/** Carga la cuenta en sesión y su perfil. Reemplazar el mock por fetch. */
export function usePerfil() {
  const { data, isLoading, error, reload } = useAsync(mockFetch);
  return { cuenta: data?.cuenta ?? null, perfil: data?.perfil ?? null, isLoading, error, reload };
}

// MOCK — reemplazar por fetch("/api/cuenta")
async function mockFetch(): Promise<{ cuenta: CuentaSesion; perfil: Perfil }> {
  await new Promise<void>((res) => setTimeout(res, 500));
  return { cuenta: CUENTA_ACTUAL, perfil: perfilInicial(CUENTA_ACTUAL) };
}

/** Guarda los datos del perfil. Simula un fallo de servidor opcional. */
export function useGuardarPerfil() {
  const [isLoading, setIsLoading] = useState(false);
  async function guardar(_perfil: Perfil): Promise<{ ok: boolean; code?: string }> {
    setIsLoading(true);
    try {
      await new Promise<void>((res) => setTimeout(res, 800));
      // MOCK — reemplazar por PUT /api/cuenta; devolver { ok:false, code } en error
      return { ok: true };
    } finally { setIsLoading(false); }
  }
  return { guardar, isLoading };
}

// Demo: contraseña actual de la cuenta en sesión (Camila Ríos).
const PASSWORD_ACTUAL = "Cosecha#26";

/** Cambia la contraseña. Valida la actual contra el backend (mock). */
export function useCambiarPassword() {
  const [isLoading, setIsLoading] = useState(false);
  async function cambiar(actual: string, _nueva: string): Promise<{ ok: boolean; code?: "badActual" }> {
    setIsLoading(true);
    try {
      await new Promise<void>((res) => setTimeout(res, 750));
      // MOCK — reemplazar por POST /api/cuenta/password
      if (actual !== PASSWORD_ACTUAL) return { ok: false, code: "badActual" };
      return { ok: true };
    } finally { setIsLoading(false); }
  }
  return { cambiar, isLoading };
}

/** Procesa la baja de la cuenta (comunicación con backend). */
export function useEliminarCuenta() {
  const [isLoading, setIsLoading] = useState(false);
  async function procesar(): Promise<{ ok: boolean; ts: string | null }> {
    setIsLoading(true);
    try {
      await new Promise<void>((res) => setTimeout(res, 1400));
      // MOCK — reemplazar por DELETE /api/cuenta; en error devolver { ok:false, ts:null }
      return { ok: true, ts: fechaHoraBaja() };
    } finally { setIsLoading(false); }
  }
  return { procesar, isLoading };
}
