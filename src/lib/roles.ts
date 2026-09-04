import type { Acceso, Rol } from "@/types/auth";

/** `tipoPermiso` de cada acceso → rol interno. */
const POR_TIPO: Record<string, Rol> = {
  ADMIN: "admin",
  PRODUCTOR: "productor",
  VISITANTE: "visitante",
};

/**
 * Roles que surgen de los accesos del usuario. Descarta los tipos que no
 * reconoce en lugar de arriesgar un rol inventado —de un tipo nuevo es
 * preferible no dar acceso a darlo de más— y deduplica.
 */
export function rolesDe(accesos: Acceso[] | undefined): Rol[] {
  if (!Array.isArray(accesos)) return [];
  const roles = accesos
    .map((a) => POR_TIPO[String(a?.tipoPermiso ?? "").trim().toUpperCase()])
    .filter((r): r is Rol => Boolean(r));
  return [...new Set(roles)];
}

/**
 * `true` si alguno de los accesos incluye el permiso.
 *
 * Hace la unión sobre todos los accesos. Para los permisos de ADMIN es exacto,
 * porque hay un único acceso de ese tipo; cuando lleguen permisos de PRODUCTOR
 * va a hacer falta scopear por `establecimientoId`, ya que alguien puede
 * gestionar un establecimiento y no otro.
 */
export function puede(accesos: Acceso[] | undefined, permiso: string): boolean {
  if (!Array.isArray(accesos)) return false;
  return accesos.some((a) => Array.isArray(a?.permisos) && a.permisos.includes(permiso));
}

/**
 * Chequeo de acceso del lado del cliente. Sirve para no mostrar pantallas ni
 * acciones que no corresponden, NO como control de seguridad: los accesos
 * viajan en el store persistido y son editables desde el navegador. Quien tiene
 * que rechazar cada request es el backend.
 */
export function tieneRol(roles: Rol[], requerido: Rol): boolean {
  return roles.includes(requerido);
}

/**
 * Nombre del rol para un tipo de acceso, p. ej. "Administrador Líder" para
 * ADMIN. Cadena vacía si la cuenta no tiene un acceso de ese tipo: quien lo
 * muestre decide qué poner en su lugar.
 */
export function nombreRol(accesos: Acceso[] | undefined, tipoPermiso: string): string {
  if (!Array.isArray(accesos)) return "";
  const acceso = accesos.find(
    (a) => String(a?.tipoPermiso ?? "").trim().toUpperCase() === tipoPermiso,
  );
  return acceso?.rolNombre ?? "";
}

/** Un establecimiento donde la cuenta es productora, listo para el switcher. */
export interface EstablecimientoAcceso {
  id: string;
  nombre: string;
  /** Rol de la cuenta en ese establecimiento, p. ej. "Propietaria". */
  rolNombre: string;
}

/**
 * Establecimientos de los accesos de tipo PRODUCTOR, en el orden en que vienen.
 * Descarta los que no traen `establecimientoId`: sin id no hay nada que
 * seleccionar ni por dónde pedir los datos.
 */
export function establecimientosDe(accesos: Acceso[] | undefined): EstablecimientoAcceso[] {
  if (!Array.isArray(accesos)) return [];
  return accesos
    .filter((a) => String(a?.tipoPermiso ?? "").trim().toUpperCase() === "PRODUCTOR")
    .filter((a) => typeof a?.establecimientoId === "string" && a.establecimientoId.trim() !== "")
    .map((a) => ({
      id: a.establecimientoId as string,
      nombre: a.establecimientoNombre ?? "",
      rolNombre: a.rolNombre ?? "",
    }));
}
