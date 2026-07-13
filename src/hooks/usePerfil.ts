import { useCallback, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../firebase.config";
import { apiFetch } from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";
import { fechaHoraBaja } from "@/data/cuenta";
import type { CuentaSesion, Perfil, RolCuenta } from "@/data/cuenta";
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
      fechaNac: data.fechaNacimiento ? new Date(data.fechaNacimiento) : null,
      // El backend devuelve el iso2 en `paisIso2`.
      pais: data.paisIso2 ?? "",
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

/** Guarda los datos del perfil. Simula un fallo de servidor opcional. */
export function useGuardarPerfil() {
  const [isLoading, setIsLoading] = useState(false);
  async function guardar(
    _perfil: Perfil,
  ): Promise<{ ok: boolean; code?: string }> {
    setIsLoading(true);
    try {
      await new Promise<void>((res) => setTimeout(res, 800));
      // MOCK — reemplazar por PUT /api/cuenta; devolver { ok:false, code } en error
      return { ok: true };
    } finally {
      setIsLoading(false);
    }
  }
  return { guardar, isLoading };
}

// Demo: contraseña actual de la cuenta en sesión (Camila Ríos).
const PASSWORD_ACTUAL = "Cosecha#26";

/** Cambia la contraseña. Valida la actual contra el backend (mock). */
export function useCambiarPassword() {
  const [isLoading, setIsLoading] = useState(false);
  async function cambiar(
    actual: string,
    _nueva: string,
  ): Promise<{ ok: boolean; code?: "badActual" }> {
    setIsLoading(true);
    try {
      await new Promise<void>((res) => setTimeout(res, 750));
      // MOCK — reemplazar por POST /api/cuenta/password
      if (actual !== PASSWORD_ACTUAL) return { ok: false, code: "badActual" };
      return { ok: true };
    } finally {
      setIsLoading(false);
    }
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
    } finally {
      setIsLoading(false);
    }
  }
  return { procesar, isLoading };
}
