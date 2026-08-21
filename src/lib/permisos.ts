/**
 * Códigos de permiso y tipos de permiso del backend, en un solo lugar.
 *
 * Son espejo de los enums `PermisoCodigo` y `TipoPermisoNombre` de la API: los
 * valores viajan como strings dentro de cada acceso, así que un typo no lo
 * atrapa nadie —el chequeo simplemente da `false` y la pantalla o el ítem del
 * menú desaparecen sin error—. Centralizarlos hace que el compilador avise, y
 * que agregar un permiso sea una línea acá y no una búsqueda por todo el front.
 *
 * Se usan objetos `as const` en vez de `enum`: no dejan runtime detrás, se
 * comparan y serializan como los strings que son, y el tipo del mismo nombre da
 * la misma ergonomía que un enum en el punto de uso.
 */

/**
 * Ámbito de aplicación de un rol y, por lo tanto, de sus permisos. Los de
 * PRODUCTOR además valen sólo dentro de un establecimiento (ver `AmbitoRol`).
 */
export const TipoPermiso = {
  ADMIN: "ADMIN",
  PRODUCTOR: "PRODUCTOR",
  VISITANTE: "VISITANTE",
} as const;

export type TipoPermiso = (typeof TipoPermiso)[keyof typeof TipoPermiso];

/** Permisos del ámbito ADMIN: los que se chequean en /admin. */
export const PermisoAdmin = {
  LEER_ADMIN: "LEER_ADMIN",
  GESTIONAR_ADMIN: "GESTIONAR_ADMIN",
  LEER_ROLES_ADMIN: "LEER_ROLES_ADMIN",
  LEER_SOLICITUD_ESTABLECIMIENTO: "LEER_SOLICITUD_ESTABLECIMIENTO",
  GESTIONAR_SOLICITUD_ESTABLECIMIENTO: "GESTIONAR_SOLICITUD_ESTABLECIMIENTO",
} as const;

export type PermisoAdmin = (typeof PermisoAdmin)[keyof typeof PermisoAdmin];

/**
 * Permisos del ámbito PRODUCTOR. Todavía no se chequea ninguno en el front
 * —/panel entra por tipo de acceso—, pero están para que el catálogo sea el
 * enum completo del backend y no la mitad que hoy se usa.
 */
export const PermisoProductor = {
  LEER_PRODUCTOR: "LEER_PRODUCTOR",
  GESTIONAR_PRODUCTOR: "GESTIONAR_PRODUCTOR",
  LEER_ROLES_PRODUCTOR: "LEER_ROLES_PRODUCTOR",
} as const;

export type PermisoProductor = (typeof PermisoProductor)[keyof typeof PermisoProductor];

/** Cualquier permiso del sistema, sea cual sea su ámbito. */
export type Permiso = PermisoAdmin | PermisoProductor;
