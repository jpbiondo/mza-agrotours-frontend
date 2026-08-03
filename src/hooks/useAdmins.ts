import { useCallback, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../firebase.config";
import { ApiError, apiFetch } from "@/lib/api";
import type { AdminSistema, RolAdmin, UsuarioCard } from "@/types/admin";

/**
 * Estos endpoints devuelven el payload crudo (un array o un objeto), a
 * diferencia de /departamentos/ y compañía que lo envuelven en { ok, code, data }.
 * `desenvolver` acepta las dos formas para que un cambio de contrato de este
 * lado no rompa la pantalla en silencio.
 */
function desenvolver<T>(res: unknown): T | null {
  if (res && typeof res === "object" && "ok" in res) {
    const env = res as { ok: boolean; data?: T };
    return env.ok ? (env.data ?? null) : null;
  }
  return (res as T) ?? null;
}

/** Corre `fn` con el ID token de Firebase; lanza si no hay sesión. */
async function conToken<T>(fn: (token: string) => Promise<T>): Promise<T> {
  const user = auth.currentUser;
  if (!user) throw new Error("Sin sesión");
  return fn(await user.getIdToken());
}

/* ---- Lista de administradores vigentes ---------------------------------- */

interface UseAdministradoresReturn {
  /** Siempre definido: `[]` significa "cargó y no hay ninguno". */
  administradores: AdminSistema[];
  isLoading: boolean;
  error: string | null;
  reload: () => void;
  /** Agrega el recién creado sin volver a pedir la lista entera. */
  agregar: (a: AdminSistema) => void;
}

export function useAdministradores(): UseAdministradoresReturn {
  const [administradores, setAdministradores] = useState<AdminSistema[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    let active = true;

    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!active) return;
      if (!user) {
        setError("Necesitás iniciar sesión para ver los administradores");
        setIsLoading(false);
        return;
      }
      try {
        const token = await user.getIdToken();
        const res = await apiFetch<unknown>("/administradores-sistemas/", { token });
        if (!active) return;
        const data = desenvolver<AdminSistema[]>(res);
        setAdministradores(Array.isArray(data) ? data : []);
      } catch (e) {
        if (active) setError(e instanceof Error ? e.message : "Error inesperado");
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
    setNonce((n) => n + 1);
  }, []);

  const agregar = useCallback((a: AdminSistema) => {
    setAdministradores((prev) => [...prev, a]);
  }, []);

  return { administradores, isLoading, error, reload, agregar };
}

/* ---- Roles asignables ---------------------------------------------------- */

export function useRolesAdmin(): { roles: RolAdmin[]; isLoading: boolean; error: string | null } {
  const [roles, setRoles] = useState<RolAdmin[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!active) return;
      if (!user) {
        setIsLoading(false);
        return;
      }
      try {
        const token = await user.getIdToken();
        const res = await apiFetch<unknown>("/administradores-sistemas/roles", { token });
        if (!active) return;
        const data = desenvolver<RolAdmin[]>(res);
        setRoles(Array.isArray(data) ? data : []);
      } catch (e) {
        if (active) setError(e instanceof Error ? e.message : "No pudimos cargar los roles");
      } finally {
        if (active) setIsLoading(false);
      }
    });

    return () => {
      active = false;
      unsub();
    };
  }, []);

  return { roles, isLoading, error };
}

/* ---- Alta ---------------------------------------------------------------- */

interface CrearResult {
  ok: boolean;
  code?: string;
  admin?: AdminSistema;
}

export function useCrearAdmin() {
  const [isLoading, setIsLoading] = useState(false);

  async function crear(email: string, rolId: string): Promise<CrearResult> {
    setIsLoading(true);
    try {
      const res = await conToken((token) =>
        apiFetch<unknown>("/administradores-sistemas/create", {
          method: "POST",
          token,
          body: JSON.stringify({ email, rolId }),
        }),
      );
      const admin = desenvolver<AdminSistema>(res);
      return admin ? { ok: true, admin } : { ok: false };
    } catch (e) {
      if (e instanceof ApiError) return { ok: false, code: e.code };
      return { ok: false };
    } finally {
      setIsLoading(false);
    }
  }

  return { crear, isLoading };
}

/* ---- Búsqueda de la cuenta por email ------------------------------------- */

type EstadoCard = "idle" | "buscando" | "encontrado" | "no-existe" | "error";

interface UseUsuarioCardReturn {
  card: UsuarioCard | null;
  estado: EstadoCard;
}

/**
 * Busca la cuenta del email tipeado (GET /usuario/card/{email}), con un debounce
 * para no pegarle al backend en cada tecla. `habilitado` lo controla el llamador
 * para no consultar mientras el email todavía no es válido.
 */
export function useUsuarioCard(email: string, habilitado: boolean): UseUsuarioCardReturn {
  const clave = habilitado && email ? email : "";
  // El resultado se guarda junto a la clave que lo produjo: así el estado de
  // carga se deriva comparando (como en `useAsync`) en vez de setearlo dentro
  // del efecto, que dispara renders en cascada.
  const [res, setRes] = useState<{ clave: string; card: UsuarioCard | null; estado: EstadoCard }>({
    clave: "",
    card: null,
    estado: "idle",
  });

  useEffect(() => {
    if (!clave) return;

    let active = true;
    const t = setTimeout(async () => {
      try {
        const raw = await conToken((token) =>
          apiFetch<unknown>(`/usuario/card/${encodeURIComponent(clave)}`, { token }),
        );
        if (!active) return;
        const data = desenvolver<UsuarioCard>(raw);
        setRes(
          data?.nombre
            ? { clave, card: data, estado: "encontrado" }
            : { clave, card: null, estado: "no-existe" },
        );
      } catch (e) {
        if (!active) return;
        // Un 404 es "no hay cuenta con ese correo", no un fallo técnico.
        const estado: EstadoCard =
          e instanceof ApiError && e.status === 404 ? "no-existe" : "error";
        setRes({ clave, card: null, estado });
      }
    }, 400);

    return () => {
      active = false;
      clearTimeout(t);
    };
  }, [clave]);

  if (!clave) return { card: null, estado: "idle" };
  if (res.clave !== clave) return { card: null, estado: "buscando" };
  return { card: res.card, estado: res.estado };
}
