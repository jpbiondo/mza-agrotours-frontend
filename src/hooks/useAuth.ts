import { useState } from "react";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { FirebaseError } from "firebase/app";
import { auth } from "../../firebase.config";
import { apiFetch } from "@/lib/api";
import { rolesDe } from "@/lib/roles";
import { useAuthStore } from "@/stores/authStore";
import type {
  Cuenta,
  Credenciales,
  AuthCode,
  AuthResult,
  BackendProfile,
} from "@/types/auth";

interface UseAuthReturn {
  login: (creds: Credenciales) => Promise<Cuenta>;
  isLoading: boolean;
  authError: AuthCode | null;
  clearError: () => void;
}

/** Endpoint del perfil en el backend. */
const PROFILE_PATH = "/usuario/me";

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
 * Cierra la sesión: signOut de Firebase + limpia el store, y navega con recarga
 * dura para resetear la UI (navbar en estado deslogueado). `destino` permite pasar
 * un motivo por query (p. ej. tras cambiar el email, que obliga a re-loguearse).
 */
export async function cerrarSesion(destino = "/acceso"): Promise<void> {
  try {
    await signOut(auth);
  } finally {
    useAuthStore.getState().clear();
    window.location.href = destino;
  }
}

/**
 * Login real.
 * Dos pasos: (1) Firebase valida las credenciales y nos da un ID token;
 * (2) el backend Spring devuelve el perfil ({ ok, code, data }), autenticando
 * al usuario con ese ID token (Bearer). El perfil se guarda en el store global.
 */
async function firebaseLogin({
  email,
  password,
}: Credenciales): Promise<AuthResult> {
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

  const accesos = res.data.accesos ?? [];
  const cuenta: Cuenta = { ...res.data, roles: rolesDe(accesos) };

  useAuthStore.getState().setSession({
    nombre: cuenta.nombre,
    email: cuenta.email,
    accesos,
  });

  return { ok: true, code: "ok", cuenta };
}
