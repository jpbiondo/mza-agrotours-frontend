/* ---- Roles y catálogo de permisos --------------------------------------- */

/**
 * Un rol con los permisos que otorga: item de GET /admin/roles y de
 * GET /establecimientos/{id}/roles. El contrato es el mismo para los dos
 * ámbitos —cambian el endpoint y qué códigos vienen, no la forma—, así que la
 * pantalla de /admin y la del panel comparten estos tipos.
 *
 * Los endpoints sólo devuelven los roles vigentes, así que no hay campo de baja.
 */
export interface RolDetalle {
  id: string;
  nombre: string;
  descripcion: string;
  /** Códigos sueltos, p. ej. "LEER_ADMIN". Se cruzan contra `GrupoPermiso`. */
  permisos: string[];
  /** Personas que hoy tienen el rol; con al menos una no se puede borrar. */
  cantidadUsuarios: number;
  /** Rol de sistema: no se modifica ni se da de baja. */
  esProtegido: boolean;
}

/**
 * Cuerpo del alta y de la modificación de un rol: es el mismo para las dos, y
 * el mismo en los dos ámbitos. `permisos` son códigos del catálogo.
 */
export interface DatosRol {
  nombre: string;
  descripcion: string;
  permisos: string[];
}

/**
 * Las tres mutaciones de la pantalla de roles. Cada ámbito las arma con sus
 * endpoints —/admin/roles o /establecimientos/{id}/roles— y la pantalla que las
 * usa no necesita saber cuál.
 */
export interface AccionesRoles {
  crear: (datos: DatosRol) => Promise<{ ok: boolean; code?: string; id?: string }>;
  actualizar: (rolId: string, datos: DatosRol) => Promise<{ ok: boolean; code?: string }>;
  darBaja: (rolId: string) => Promise<{ ok: boolean; code?: string }>;
  guardando: boolean;
  borrando: boolean;
}

/**
 * Permiso del catálogo. El `codigo` es la identidad —es lo que traen los roles
 * y lo que compara `tienePermiso()`—; el resto existe sólo para mostrarlo.
 */
export interface PermisoCatalogo {
  codigo: string;
  nombre: string;
  descripcion: string;
}

/**
 * Item de GET /permisos/grupos-permisos/{admin|productor}: el catálogo de
 * permisos que existen, agrupado por recurso. Es la fuente de verdad de qué se
 * puede marcar —los roles sólo traen códigos—, y por eso vive en el backend:
 * agregar un permiso no debería requerir tocar el front.
 */
export interface GrupoPermiso {
  /** Hace de clave: el backend no manda id. */
  nombre: string;
  descripcion: string;
  /** Slug del icono, p. ej. "user-cog"; se resuelve contra el mapa del front. */
  icono: string;
  permisos: PermisoCatalogo[];
}
