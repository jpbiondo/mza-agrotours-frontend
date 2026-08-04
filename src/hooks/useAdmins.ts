import { useCallback, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../firebase.config";
import { ApiError, apiFetch } from "@/lib/api";
import type { AdminSistema, RolAdmin, UsuarioCard } from "@/types/admin";

interface Envelope<T> {
  ok: boolean;
  code?: string;
  data?: T;
}

/**
 * Normaliza la respuesta al envelope `{ ok, code, data }`. Sigue aceptando el
 * payload crudo —un array o un objeto suelto— por si algún endpoint todavía no
 * lo envuelve; en ese caso se asume éxito.
 *
 * Importante: conserva el `code` cuando `ok` es false, que es como el backend
 * manda los errores de dominio con status 2xx.
 */
function comoEnvelope<T>(res: unknown): Envelope<T> {
  if (res && typeof res === "object" && "ok" in res) {
    const env = res as Envelope<T>;
    return { ok: env.ok, code: env.code, data: env.data };
  }
  return { ok: true, data: (res as T) ?? undefined };
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
  /** Reemplaza el actualizado, respetando la posición que tenía en la tabla. */
  reemplazar: (a: AdminSistema) => void;
  /** Saca al dado de baja sin volver a pedir la lista entera. */
  quitar: (adminId: string) => void;
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
        const res = await apiFetch<unknown>("/administradores-sistemas/", {
          token,
        });
        if (!active) return;
        const env = comoEnvelope<AdminSistema[]>(res);
        if (!env.ok) {
          setError(env.code ?? "No pudimos cargar los administradores");
          return;
        }
        // Envelope ok sin `data` es lista vacía, no error: el estado vacío tiene
        // que ser distinguible de un fallo de carga.
        setAdministradores(Array.isArray(env.data) ? env.data : []);
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
    setNonce((n) => n + 1);
  }, []);

  const agregar = useCallback((a: AdminSistema) => {
    setAdministradores((prev) => [...prev, a]);
  }, []);

  const reemplazar = useCallback((a: AdminSistema) => {
    setAdministradores((prev) => prev.map((x) => (x.id === a.id ? a : x)));
  }, []);

  const quitar = useCallback((adminId: string) => {
    setAdministradores((prev) => prev.filter((x) => x.id !== adminId));
  }, []);

  return { administradores, isLoading, error, reload, agregar, reemplazar, quitar };
}

/* ---- Roles asignables ---------------------------------------------------- */

export function useRolesAdmin(): {
  roles: RolAdmin[];
  isLoading: boolean;
  error: string | null;
} {
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
        const res = await apiFetch<unknown>("/administradores-sistemas/roles", {
          token,
        });
        if (!active) return;
        const env = comoEnvelope<RolAdmin[]>(res);
        if (!env.ok) {
          setError(env.code ?? "No pudimos cargar los roles");
          return;
        }
        setRoles(Array.isArray(env.data) ? env.data : []);
      } catch (e) {
        if (active)
          setError(
            e instanceof Error ? e.message : "No pudimos cargar los roles",
          );
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
          body: JSON.stringify({ emailUsuario: email, rolId }),
        }),
      );
      const env = comoEnvelope<AdminSistema>(res);
      // El code viaja tanto en el envelope 2xx como en el ApiError de un 4xx.
      return env.ok && env.data
        ? { ok: true, admin: env.data }
        : { ok: false, code: env.code };
    } catch (e) {
      if (e instanceof ApiError) return { ok: false, code: e.code };
      return { ok: false };
    } finally {
      setIsLoading(false);
    }
  }

  return { crear, isLoading };
}

/* ---- Cambio de rol ------------------------------------------------------- */

export function useActualizarAdmin() {
  const [isLoading, setIsLoading] = useState(false);

  /** El adminId va en la URL; el body sólo lleva el rol nuevo. */
  async function actualizar(adminId: string, rolId: string): Promise<CrearResult> {
    setIsLoading(true);
    try {
      const res = await conToken((token) =>
        apiFetch<unknown>(`/administradores-sistemas/update/${encodeURIComponent(adminId)}`, {
          method: "PUT",
          token,
          body: JSON.stringify({ rolId }),
        }),
      );
      const env = comoEnvelope<AdminSistema>(res);
      return env.ok && env.data
        ? { ok: true, admin: env.data }
        : { ok: false, code: env.code };
    } catch (e) {
      if (e instanceof ApiError) return { ok: false, code: e.code };
      return { ok: false };
    } finally {
      setIsLoading(false);
    }
  }

  return { actualizar, isLoading };
}

/* ---- Baja ---------------------------------------------------------------- */

export function useEliminarAdmin() {
  const [isLoading, setIsLoading] = useState(false);

  async function eliminar(adminId: string): Promise<{ ok: boolean; code?: string }> {
    setIsLoading(true);
    try {
      const res = await conToken((token) =>
        apiFetch<unknown>(`/administradores-sistemas/${encodeURIComponent(adminId)}`, {
          method: "DELETE",
          token,
        }),
      );
      const env = comoEnvelope<unknown>(res);
      return env.ok ? { ok: true } : { ok: false, code: env.code };
    } catch (e) {
      if (e instanceof ApiError) return { ok: false, code: e.code };
      // `apiFetch` sólo llega a res.json() con un 2xx, así que un error de
      // parseo significa que la baja se hizo y el backend contestó sin cuerpo
      // (204). Un fallo de red tira TypeError antes y cae abajo.
      if (e instanceof SyntaxError) return { ok: true };
      return { ok: false };
    } finally {
      setIsLoading(false);
    }
  }

  return { eliminar, isLoading };
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
export function useUsuarioCard(
  email: string,
  habilitado: boolean,
): UseUsuarioCardReturn {
  const clave = habilitado && email ? email : "";
  // El resultado se guarda junto a la clave que lo produjo: así el estado de
  // carga se deriva comparando (como en `useAsync`) en vez de setearlo dentro
  // del efecto, que dispara renders en cascada.
  const [res, setRes] = useState<{
    clave: string;
    card: UsuarioCard | null;
    estado: EstadoCard;
  }>({
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
          apiFetch<unknown>(`/usuario/card/${encodeURIComponent(clave)}`, {
            token,
          }),
        );
        if (!active) return;
        // Sin cuenta, el backend responde 404 o un envelope ok:false; las dos
        // formas significan lo mismo acá: no hay usuario con ese correo.
        const env = comoEnvelope<UsuarioCard>(raw);
        const data = env.ok ? (env.data ?? null) : null;
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
