import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { FirebaseError } from "firebase/app";
import { auth } from "../../firebase.config";
import { ApiError, apiFetch } from "@/lib/api";
import { rolesDe } from "@/lib/roles";
import { useAuthStore } from "@/stores/authStore";
import {
  CODIGO_PERFIL_INACTIVO,
  CODIGO_PERFIL_INEXISTENTE,
  RUTA_COMPLETAR_REGISTRO,
} from "@/data/auth";
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
  code?: string;
  data?: BackendProfile;
}

export function useAuth(): UseAuthReturn {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<AuthCode | null>(null);

  async function login(creds: Credenciales): Promise<Cuenta> {
    setIsLoading(true);
    setAuthError(null);
    try {
      const res = await firebaseLogin(creds);
      if (res.code === "sinPerfil") {
        // La cuenta de Firebase existe pero el alta no llegó a crear el perfil:
        // se completa, no se vuelve al sign-up (crearía otra cuenta).
        router.replace(RUTA_COMPLETAR_REGISTRO);
        throw new Error(res.code);
      }
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

export type ResultadoPerfil =
  | { estado: "ok"; cuenta: Cuenta }
  /** Autenticado en Firebase, pero sin perfil en el backend (alta a medias). */
  | { estado: "sinPerfil" }
  /** Perfil dado de baja: no se completa ni se recrea. */
  | { estado: "inactivo" }
  /** `code` es el de dominio si el backend lo mandó; sin él, fallo técnico. */
  | { estado: "error"; code?: string };

function resultadoDeCodigo(code?: string): ResultadoPerfil {
  if (code === CODIGO_PERFIL_INEXISTENTE) return { estado: "sinPerfil" };
  if (code === CODIGO_PERFIL_INACTIVO) return { estado: "inactivo" };
  return { estado: "error", code };
}

/**
 * Trae el perfil (GET /usuario/me con el ID token) y, si existe, lo guarda en
 * el store. Se llama después de cada login, al restaurar la sesión y al
 * terminar el alta. Con `sinPerfil` o `inactivo` no toca el store ni la
 * sesión: decide el llamador.
 */
export async function cargarPerfil(token: string): Promise<ResultadoPerfil> {
  let res: ProfileResponse;
  try {
    res = await apiFetch<ProfileResponse>(PROFILE_PATH, { token });
  } catch (e) {
    return resultadoDeCodigo(e instanceof ApiError ? e.code : undefined);
  }

  if (!res.ok || !res.data) return resultadoDeCodigo(res.code);

  const accesos = res.data.accesos ?? [];
  const cuenta: Cuenta = { ...res.data, roles: rolesDe(accesos) };

  useAuthStore.getState().setSession({
    nombre: cuenta.nombre,
    email: cuenta.email,
    accesos,
  });

  return { estado: "ok", cuenta };
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

  // Un fallo técnico (red / 5xx) → "error" genérico, nunca se disfraza de
  // badCreds ni falla en silencio.
  const perfil = await cargarPerfil(token);
  if (perfil.estado === "ok") return { ok: true, code: "ok", cuenta: perfil.cuenta };
  if (perfil.estado === "sinPerfil") {
    useAuthStore.getState().clear();
    return { ok: false, code: "sinPerfil" };
  }
  if (perfil.estado === "inactivo") {
    // Firebase todavía no borró la cuenta: las credenciales valen, pero la
    // sesión no tiene que quedar abierta.
    await signOut(auth).catch(() => undefined);
    useAuthStore.getState().clear();
    return { ok: false, code: "baja" };
  }
  return { ok: false, code: "error" };
}
