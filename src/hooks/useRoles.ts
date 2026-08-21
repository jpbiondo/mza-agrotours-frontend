import { useCallback, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../firebase.config";
import { ApiError, apiFetch, comoEnvelope } from "@/lib/api";
import { conToken } from "@/lib/sesion";
import type {
  AccionesRoles, DatosRol, GrupoPermiso, PermisoCatalogo, RolDetalle,
} from "@/types/roles";

/* Los roles de administrador cuelgan del sistema; los de productor, de cada
   establecimiento. El catálogo de permisos está partido por ámbito: cada
   pantalla sólo puede marcar los permisos del suyo. */
const ROLES_ADMIN = "/admin/roles";
const GRUPOS_ADMIN = "/permisos/grupos-permisos/admin";
const GRUPOS_PRODUCTOR = "/permisos/grupos-permisos/productor";

/** Base de los roles de un establecimiento; el alta, el PUT y el DELETE cuelgan de acá. */
export function rolesDeEstablecimiento(establecimientoId: string): string {
  return `/establecimientos/${encodeURIComponent(establecimientoId)}/roles`;
}

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

function aRol(r: RolBackend, i: number): RolDetalle {
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
  roles: RolDetalle[];
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
 *
 * `rolesPath` en `null` significa que todavía no hay de dónde pedirlos —el
 * productor sin establecimiento elegido—: no se pide nada y la pantalla dibuja
 * su propio vacío.
 */
function useCatalogoRoles(rolesPath: string | null, gruposPath: string): UseRolesReturn {
  const [nonce, setNonce] = useState(0);
  /**
   * Lo cargado, con la clave de la petición que lo trajo. Guardar la clave
   * junto a los datos evita el estado de carga imperativo: mientras no coincida
   * con la clave actual, lo que hay en pantalla es de otra petición y la
   * pantalla está cargando. Sin eso, al cambiar de establecimiento se verían un
   * frame los roles de la finca anterior bajo el nombre de la nueva.
   */
  const [cargado, setCargado] = useState<{
    clave: string;
    roles: RolDetalle[];
    grupos: GrupoPermiso[];
    error: string | null;
  } | null>(null);

  // `reload` cambia la clave sin cambiar los endpoints, y así vuelve a pedir.
  const clave = rolesPath ? `${nonce}|${rolesPath}|${gruposPath}` : "";
  const alDia = !!clave && cargado?.clave === clave;

  useEffect(() => {
    if (!rolesPath) return;
    let active = true;

    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!active) return;
      const fin = (
        datos: Partial<{ roles: RolDetalle[]; grupos: GrupoPermiso[]; error: string }>,
      ) => setCargado({ clave, roles: [], grupos: [], error: null, ...datos });

      if (!user) {
        fin({ error: "Necesitás iniciar sesión para ver los roles" });
        return;
      }
      try {
        const token = await user.getIdToken();
        const [resRoles, resGrupos] = await Promise.all([
          apiFetch<unknown>(rolesPath, { token }),
          apiFetch<unknown>(gruposPath, { token }),
        ]);
        if (!active) return;

        const envRoles = comoEnvelope<RolBackend[]>(resRoles);
        const envGrupos = comoEnvelope<GrupoBackend[]>(resGrupos);
        if (!envRoles.ok || !envGrupos.ok) {
          fin({ error: envRoles.code ?? envGrupos.code ?? "No pudimos cargar los roles" });
          return;
        }
        // Envelope ok sin `data` es lista vacía, no error.
        fin({
          roles: Array.isArray(envRoles.data) ? envRoles.data.map(aRol) : [],
          grupos: Array.isArray(envGrupos.data) ? envGrupos.data.map(aGrupo) : [],
        });
      } catch (e) {
        if (active) fin({ error: e instanceof Error ? e.message : "Error inesperado" });
      }
    });

    return () => {
      active = false;
      unsub();
    };
  }, [clave, rolesPath, gruposPath]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);

  return {
    roles: alDia ? cargado.roles : [],
    grupos: alDia ? cargado.grupos : [],
    // Sin ruta no hay nada que esperar: la pantalla dibuja su propio vacío.
    isLoading: !!rolesPath && !alDia,
    error: alDia ? cargado.error : null,
    reload,
  };
}

/** Roles de administrador del sistema. */
export function useRoles(): UseRolesReturn {
  return useCatalogoRoles(ROLES_ADMIN, GRUPOS_ADMIN);
}

/**
 * Roles de un establecimiento. Con el id vacío —cuenta sin establecimientos— no
 * se pide nada: no hay ninguno del que pedir los roles.
 */
export function useRolesProductor(establecimientoId: string): UseRolesReturn {
  const path = establecimientoId ? rolesDeEstablecimiento(establecimientoId) : null;
  return useCatalogoRoles(path, GRUPOS_PRODUCTOR);
}

/* ---- Alta, modificación y baja ------------------------------------------- */

/**
 * Las tres mutaciones sobre una misma base: `/admin/roles` o los roles de un
 * establecimiento. El alta y la modificación mandan el mismo cuerpo; la baja,
 * sólo el id en la URL.
 */
export function useRolesCrud(basePath: string): AccionesRoles {
  const [guardando, setGuardando] = useState(false);
  const [borrando, setBorrando] = useState(false);

  const rolUrl = (rolId: string) => `${basePath}/${encodeURIComponent(rolId)}`;

  async function crear(datos: DatosRol) {
    setGuardando(true);
    try {
      const res = await conToken((token) =>
        apiFetch<unknown>(basePath, { method: "POST", token, body: JSON.stringify(datos) }),
      );
      // La respuesta trae también nombre y descripción, que la pantalla ya
      // tiene: lo único que no puede saber es el id que se asignó.
      const env = comoEnvelope<{ id?: string }>(res);
      // El code viaja tanto en el envelope 2xx como en el ApiError de un 4xx.
      return env.ok ? { ok: true, id: env.data?.id } : { ok: false, code: env.code };
    } catch (e) {
      if (e instanceof ApiError) return { ok: false, code: e.code };
      return { ok: false };
    } finally {
      setGuardando(false);
    }
  }

  async function actualizar(rolId: string, datos: DatosRol) {
    setGuardando(true);
    try {
      const res = await conToken((token) =>
        apiFetch<unknown>(rolUrl(rolId), { method: "PUT", token, body: JSON.stringify(datos) }),
      );
      const env = comoEnvelope<unknown>(res);
      // La respuesta confirma id, nombre y descripción: nada que la pantalla no
      // tenga ya, así que sólo interesa si salió bien.
      return env.ok ? { ok: true } : { ok: false, code: env.code };
    } catch (e) {
      if (e instanceof ApiError) return { ok: false, code: e.code };
      return { ok: false };
    } finally {
      setGuardando(false);
    }
  }

  async function darBaja(rolId: string) {
    setBorrando(true);
    try {
      const res = await conToken((token) =>
        apiFetch<unknown>(rolUrl(rolId), { method: "DELETE", token }),
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
      setBorrando(false);
    }
  }

  return { crear, actualizar, darBaja, guardando, borrando };
}

/** Las mutaciones sobre los roles de administrador. */
export function useRolesCrudAdmin(): AccionesRoles {
  return useRolesCrud(ROLES_ADMIN);
}
