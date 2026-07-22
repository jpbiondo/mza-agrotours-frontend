import { useCallback, useEffect, useState } from "react";
import {
  onAuthStateChanged,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from "firebase/auth";
import { FirebaseError } from "firebase/app";
import { auth } from "../../firebase.config";
import { apiFetch, ApiError } from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";
import { fechaHoraBaja } from "@/data/cuenta";
import type {
  CondicionIncumplida,
  CuentaSesion,
  Perfil,
  RolCuenta,
} from "@/data/cuenta";
import type { BackendProfile, Rol } from "@/types/auth";

interface PerfilState {
  cuenta: CuentaSesion | null;
  perfil: Perfil | null;
  isLoading: boolean;
  error: string | null;
  /** No hay sesión de Firebase: la pantalla debe redirigir a /acceso. */
  unauthenticated: boolean;
  reload: () => void;
}

/** El backend aún no envía roles ni fecha/país; toma un rol primario para la UI. */
function rolPrimario(roles: Rol[]): RolCuenta {
  if (roles.includes("admin")) return "admin";
  if (roles.includes("productor")) return "productor";
  return "visitante";
}

/** Campos extra que el backend podría (aún no) incluir en /usuario/me. */
type PerfilData = BackendProfile & {
  paisIso2?: string;
};

/**
 * Parsea una fecha del backend a Date local.
 * `new Date("2002-11-10")` la interpreta como medianoche UTC y, en zonas al
 * oeste de UTC, se corre un día; por eso las fechas "YYYY-MM-DD" se arman
 * con componentes locales.
 */
function parseFecha(s: string): Date {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  return m
    ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
    : new Date(s);
}

function aModelos(
  data: PerfilData,
  roles: Rol[],
): { cuenta: CuentaSesion; perfil: Perfil } {
  return {
    cuenta: {
      nombre: data.nombre,
      email: data.email,
      rol: rolPrimario(roles),
      // TODO backend: condiciones reales de baja; por ahora habilitado.
      condicionesOk: true,
    },
    perfil: {
      nombre: data.nombre,
      email: data.email,
      telefono: data.telefono,
      identificacion: data.identificacion,
      tipoIdent: data.tipoIdentificacion,
      fechaNac: data.fechaNacimiento ? parseFecha(data.fechaNacimiento) : null,
      // El backend devuelve el iso2 en `paisIso2`.
      paisIso2: data.paisIso2 ?? "",
    },
  };
}

interface ProfileResponse {
  ok: boolean;
  code?: string;
  data?: PerfilData;
}

/**
 * Carga la cuenta en sesión desde el backend (GET /usuario/me con el ID token).
 * Protege la pantalla: si no hay sesión de Firebase, marca `unauthenticated`.
 */
export function usePerfil(): PerfilState {
  const [models, setModels] = useState<{
    cuenta: CuentaSesion;
    perfil: Perfil;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unauthenticated, setUnauthenticated] = useState(false);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    let active = true;

    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!active) return;
      if (!user) {
        setUnauthenticated(true);
        setIsLoading(false);
        return;
      }
      try {
        const token = await user.getIdToken();
        const res = await apiFetch<ProfileResponse>("/usuario/me", { token });
        if (!active) return;
        if (!res.ok || !res.data) {
          setError(res.code ?? "No pudimos cargar tu cuenta");
        } else {
          setModels(aModelos(res.data, useAuthStore.getState().roles));
        }
      } catch (e) {
        if (active)
          setError(e instanceof Error ? e.message : "Error inesperado");
      } finally {
        if (active) setIsLoading(false);
      }
    });

    return () => {
      active = false;
      unsub();
    };
  }, [nonce]);

  const reload = useCallback(() => {
    setIsLoading(true);
    setError(null);
    setUnauthenticated(false);
    setNonce((n) => n + 1);
  }, []);

  return {
    cuenta: models?.cuenta ?? null,
    perfil: models?.perfil ?? null,
    isLoading,
    error,
    unauthenticated,
    reload,
  };
}

/** Payload de PUT /usuario/me (mismos nombres que /usuario/create, sin password). */
function toPerfilPayload(p: Perfil) {
  return {
    nombre: p.nombre.trim(),
    email: p.email.trim().toLowerCase(),
    telefono: p.telefono.trim(),
    identificacion: p.identificacion.trim(),
    tipoIdentificacion: p.tipoIdent,
    paisIso2: p.paisIso2,
    fechaNacimiento: p.fechaNac ? p.fechaNac.toISOString() : null,
  };
}

interface SavePerfilResponse {
  ok: boolean;
  code?: string;
}

/**
 * Guarda los datos del perfil (PUT /usuario/me con el ID token de Firebase) y,
 * si sale bien, refleja el nombre/email nuevos en el store de sesión.
 * Errores de dominio (2xx `{ ok:false, code }` o 4xx vía ApiError): p. ej.
 * `userAlreadyExists`, `validationError`. Un fallo técnico sin code vuelve como
 * `{ ok:false }` → el llamador muestra un mensaje genérico.
 */
export function useGuardarPerfil() {
  const [isLoading, setIsLoading] = useState(false);

  async function guardar(perfil: Perfil): Promise<SavePerfilResponse> {
    setIsLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) return { ok: false };
      const token = await user.getIdToken();
      try {
        const res = await apiFetch<SavePerfilResponse>("/usuario/me", {
          method: "PUT",
          token,
          body: JSON.stringify(toPerfilPayload(perfil)),
        });

        if (!res.ok) {
          return { ok: false, code: res.code };
        }

        // Reflejar el nombre/email nuevos en el store de sesión (navbar, menú de
        // cuenta), con los mismos valores canónicos que se enviaron al backend.
        const store = useAuthStore.getState();
        store.setSession({
          nombre: perfil.nombre.trim(),
          email: perfil.email.trim().toLowerCase(),
          roles: store.roles,
        });

        return { ok: true };
      } catch (e) {
        // El backend modela errores de dominio con 4xx + `code` en el cuerpo:
        // ApiError lo expone. Sin code (fallo técnico) → mensaje genérico.
        if (e instanceof ApiError) return { ok: false, code: e.code };
        return { ok: false };
      }
    } finally {
      setIsLoading(false);
    }
  }

  return { guardar, isLoading };
}

/**
 * Cambia la contraseña del usuario logueado.
 * Requiere la contraseña actual: se reautentica con ella antes de actualizar,
 * así Firebase verifica que el usuario la conoce (code "badActual" si no).
 */
export function useCambiarPassword() {
  const [isLoading, setIsLoading] = useState(false);

  async function cambiar(
    actual: string,
    nueva: string,
  ): Promise<{ ok: boolean; code?: "badActual" | "error" }> {
    setIsLoading(true);
    try {
      const user = auth.currentUser;
      if (!user || !user.email) return { ok: false, code: "error" };

      // 1) Reautenticar con la contraseña actual.
      try {
        const cred = EmailAuthProvider.credential(user.email, actual);
        await reauthenticateWithCredential(user, cred);
      } catch (err) {
        if (
          err instanceof FirebaseError &&
          (err.code === "auth/wrong-password" ||
            err.code === "auth/invalid-credential")
        ) {
          return { ok: false, code: "badActual" };
        }
        return { ok: false, code: "error" };
      }

      // 2) Ya reautenticado: actualizar la contraseña.
      await updatePassword(user, nueva);
      return { ok: true };
    } catch {
      return { ok: false, code: "error" };
    } finally {
      setIsLoading(false);
    }
  }

  return { cambiar, isLoading };
}

interface MeetsDeleteResponse {
  ok: boolean;
  code?: string;
  data?: CondicionIncumplida[];
}

/**
 * Verifica si la cuenta puede darse de baja (GET /usuario/me/meets-delete-conditions).
 * `ok` con data vacía → cumple todo; `!ok` con data → condiciones incumplidas.
 * Un fallo técnico hace throw en apiFetch → el llamador muestra un error.
 */
export function useVerificarCondicionesBaja() {
  const [isLoading, setIsLoading] = useState(false);

  async function verificar(): Promise<{
    ok: boolean;
    condiciones: CondicionIncumplida[];
  }> {
    setIsLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Sin sesión");
      const token = await user.getIdToken();
      const res = await apiFetch<MeetsDeleteResponse>(
        "/usuario/me/meets-delete-conditions",
        { token },
      );
      return { ok: res.ok, condiciones: res.data ?? [] };
    } finally {
      setIsLoading(false);
    }
  }

  return { verificar, isLoading };
}

interface DeleteCuentaResponse {
  ok: boolean;
}

/**
 * Da de baja la cuenta (DELETE /usuario/me con el ID token). Si el backend
 * responde !ok devuelve las condiciones incumplidas, pero acá se ignoran (sólo
 * debug: ya se verifican al abrir el modal). Un fallo técnico → { ok:false }.
 */
export function useEliminarCuenta() {
  const [isLoading, setIsLoading] = useState(false);
  async function procesar(): Promise<{ ok: boolean; ts: string | null }> {
    setIsLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) return { ok: false, ts: null };
      const token = await user.getIdToken();
      const res = await apiFetch<DeleteCuentaResponse>("/usuario/me", {
        method: "DELETE",
        token,
      });
      return res.ok ? { ok: true, ts: fechaHoraBaja() } : { ok: false, ts: null };
    } catch {
      return { ok: false, ts: null };
    } finally {
      setIsLoading(false);
    }
  }
  return { procesar, isLoading };
}
