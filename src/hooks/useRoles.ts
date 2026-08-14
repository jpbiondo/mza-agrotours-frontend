import { useCallback, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../firebase.config";
import { apiFetch, comoEnvelope } from "@/lib/api";
import type { GrupoPermiso, PermisoCatalogo, RolAdminDetalle } from "@/types/admin";

const ROLES = "/roles/admin";
const GRUPOS = "/permisos/grupos-permisos/admin";

/** Rol crudo del listado. Campos opcionales: defensivo. */
interface RolBackend {
  id?: string;
  nombre?: string;
  descripcion?: string;
  permisos?: unknown;
  cantidadUsuarios?: unknown;
  esProtegido?: unknown;
}

/** Grupo crudo del catálogo. */
interface GrupoBackend {
  nombre?: string;
  descripcion?: string;
  icono?: string;
  permisos?: unknown;
}

/** Permiso crudo del catálogo. */
interface PermisoBackend {
  codigo?: string;
  nombre?: string;
  descripcion?: string;
}

/** Códigos de permiso de un rol, descartando lo que no sea un string con contenido. */
function aCodigos(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((p): p is string => typeof p === "string" && p.trim() !== "");
}

/**
 * Permisos del catálogo. Se descarta el que no traiga código: es la identidad
 * contra la que se cruzan los roles, y sin él el casillero no podría marcarse.
 */
function aPermisos(v: unknown): PermisoCatalogo[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((p): p is PermisoBackend => !!p && typeof p === "object")
    .map((p) => ({
      codigo: typeof p.codigo === "string" ? p.codigo.trim() : "",
      nombre: p.nombre ?? "",
      descripcion: p.descripcion ?? "",
    }))
    .filter((p) => p.codigo !== "");
}

function aRol(r: RolBackend, i: number): RolAdminDetalle {
  return {
    id: r.id ?? `sin-id-${i}`,
    nombre: r.nombre ?? "",
    descripcion: r.descripcion ?? "",
    permisos: aCodigos(r.permisos),
    cantidadUsuarios: typeof r.cantidadUsuarios === "number" ? r.cantidadUsuarios : 0,
    // Sólo `true` protege: ante un valor raro conviene dejar editar y que el
    // backend rechace, no bloquear un rol que sí se puede tocar.
    esProtegido: r.esProtegido === true,
  };
}

function aGrupo(g: GrupoBackend): GrupoPermiso {
  return {
    nombre: g.nombre ?? "",
    descripcion: g.descripcion ?? "",
    icono: g.icono ?? "",
    permisos: aPermisos(g.permisos),
  };
}

interface UseRolesReturn {
  /** Siempre definido: `[]` significa "cargó y no hay ninguno". */
  roles: RolAdminDetalle[];
  /** Catálogo de permisos: qué se puede marcar y cómo se agrupa. */
  grupos: GrupoPermiso[];
  isLoading: boolean;
  error: string | null;
  reload: () => void;
}

/**
 * Las dos lecturas de la pantalla, en paralelo y bajo un único estado de carga.
 * Van juntas porque la tabla no se puede dibujar sin el catálogo: el resumen de
 * permisos de cada rol sale de cruzar sus códigos contra los grupos, y el
 * editor necesita los grupos para saber qué casilleros existen.
 */
export function useRoles(): UseRolesReturn {
  const [roles, setRoles] = useState<RolAdminDetalle[]>([]);
  const [grupos, setGrupos] = useState<GrupoPermiso[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    let active = true;

    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!active) return;
      if (!user) {
        setError("Necesitás iniciar sesión para ver los roles");
        setIsLoading(false);
        return;
      }
      try {
        const token = await user.getIdToken();
        const [resRoles, resGrupos] = await Promise.all([
          apiFetch<unknown>(ROLES, { token }),
          apiFetch<unknown>(GRUPOS, { token }),
        ]);
        if (!active) return;

        const envRoles = comoEnvelope<RolBackend[]>(resRoles);
        const envGrupos = comoEnvelope<GrupoBackend[]>(resGrupos);
        if (!envRoles.ok || !envGrupos.ok) {
          setError(envRoles.code ?? envGrupos.code ?? "No pudimos cargar los roles");
          return;
        }
        // Envelope ok sin `data` es lista vacía, no error.
        setRoles(Array.isArray(envRoles.data) ? envRoles.data.map(aRol) : []);
        setGrupos(Array.isArray(envGrupos.data) ? envGrupos.data.map(aGrupo) : []);
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

  return { roles, grupos, isLoading, error, reload };
}

/* ---- Escritura ----------------------------------------------------------- */
// TODO backend: falta el alta/modificación (POST y PUT /roles/admin) y la baja
// (DELETE /roles/admin/{id}). Hasta que existan, estos dos siguen siendo mocks:
// simulan la demora y la pantalla actualiza su copia local, así que lo que se
// cree o borre acá desaparece al recargar.

export function useGuardarRol() {
  const [isLoading, setIsLoading] = useState(false);
  async function guardar(_rol: RolAdminDetalle): Promise<void> {
    setIsLoading(true);
    try { await new Promise<void>((res) => setTimeout(res, 600)); } finally { setIsLoading(false); }
  }
  return { guardar, isLoading };
}

export function useDarBajaRol() {
  const [isLoading, setIsLoading] = useState(false);
  async function darBaja(_id: string): Promise<void> {
    setIsLoading(true);
    try { await new Promise<void>((res) => setTimeout(res, 600)); } finally { setIsLoading(false); }
  }
  return { darBaja, isLoading };
}
