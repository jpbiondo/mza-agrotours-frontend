import { useState } from "react";
import { autenticar } from "@/data/auth";
import type { Cuenta, Credenciales, AuthCode } from "@/types/auth";

interface UseAuthReturn {
  login: (creds: Credenciales) => Promise<Cuenta>;
  isLoading: boolean;
  authError: AuthCode | null;
  clearError: () => void;
}

export function useAuth(): UseAuthReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<AuthCode | null>(null);

  async function login(creds: Credenciales): Promise<Cuenta> {
    setIsLoading(true);
    setAuthError(null);
    try {
      const res = await mockLogin(creds);
      if (!res.ok || !res.cuenta) {
        setAuthError(res.code);
        throw new Error(res.code);
      }
      return res.cuenta;
    } finally {
      setIsLoading(false);
    }
  }

  return { login, isLoading, authError, clearError: () => setAuthError(null) };
}

// MOCK — reemplazar el cuerpo con fetch real cuando el backend esté listo
async function mockLogin({ email, password }: Credenciales) {
  await new Promise<void>((res) => setTimeout(res, 700));
  return autenticar(email, password);
}