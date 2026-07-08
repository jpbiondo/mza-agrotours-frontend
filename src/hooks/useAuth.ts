import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { FirebaseError } from "firebase/app";
import { auth } from "../../firebase.config";
import { apiFetch } from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";
import type {
  Cuenta,
  Credenciales,
  AuthCode,
  AuthResult,
  BackendProfile,
  Rol,
} from "@/types/auth";

interface UseAuthReturn {
  login: (creds: Credenciales) => Promise<Cuenta>;
  isLoading: boolean;
  authError: AuthCode | null;
  clearError: () => void;
}

/** El backend aún no tiene roles: asumimos que el usuario tiene todos. */
const ALL_ROLES: Rol[] = ["visitante", "productor", "admin"];

/** Endpoint del perfil en el backend. */
const PROFILE_PATH = "/usuarios/me";

interface ProfileResponse {
  ok: boolean;
  code: AuthCode;
  data?: BackendProfile;
}

export function useAuth(): UseAuthReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<AuthCode | null>(null);

  async function login(creds: Credenciales): Promise<Cuenta> {
    setIsLoading(true);
    setAuthError(null);
    try {
      const res = await firebaseLogin(creds);
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

/**
 * Login real.
 * Dos pasos: (1) Firebase valida las credenciales y nos da un ID token;
 * (2) el backend Spring devuelve el perfil ({ ok, code, data }), autenticando
 * al usuario con ese ID token (Bearer). El perfil se guarda en el store global.
 */
async function firebaseLogin({ email, password }: Credenciales): Promise<AuthResult> {
  const correo = email.trim();

  let token: string;
  try {
    const cred = await signInWithEmailAndPassword(auth, correo, password);
    token = await cred.user.getIdToken();
  } catch (err) {
    // Credenciales inválidas / usuario inexistente / email malformado → badCreds.
    if (err instanceof FirebaseError) {
      return { ok: false, code: "badCreds" };
    }
    throw err;
  }

  // Perfil desde el backend. Un fallo técnico (red / 5xx) → "error" genérico,
  // nunca se disfraza de badCreds ni falla en silencio.
  let res: ProfileResponse;
  try {
    res = await apiFetch<ProfileResponse>(PROFILE_PATH, { token });
  } catch {
    return { ok: false, code: "error" };
  }

  if (!res.ok || !res.data) {
    return { ok: false, code: res.code ?? "error" };
  }

  const cuenta: Cuenta = { ...res.data, roles: ALL_ROLES };

  useAuthStore.getState().setSession({
    nombre: cuenta.nombre,
    email: cuenta.email,
    roles: cuenta.roles,
  });

  return { ok: true, code: "ok", cuenta };
}
