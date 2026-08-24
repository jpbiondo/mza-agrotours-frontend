import { useCallback, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../firebase.config";
import { ApiError, apiFetch, comoEnvelope } from "@/lib/api";
import { conToken } from "@/lib/sesion";
import type { AdminSistema, RolAdmin } from "@/types/admin";

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
