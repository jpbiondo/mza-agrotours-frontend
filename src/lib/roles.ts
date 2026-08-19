import type { Acceso, Rol } from "@/types/auth";

/** `tipoPermiso` de cada acceso → rol interno. */
const POR_TIPO: Record<string, Rol> = {
  ADMIN: "admin",
  PRODUCTOR: "productor",
  VISITANTE: "visitante",
};

/**
 * Nombre del rol de administración que puede gestionar el sistema. Lo define el
 * backend —viaja en `rolNombre`— y es el único rol protegido con el que el
 * front necesita comparar; el resto se crean desde la pantalla de roles.
 */
export const ROL_ADMIN_LIDER = "Administrador Líder";

/** `tipoPermiso` normalizado, que es como lo compara todo este archivo. */
function tipoDe(acceso: Acceso | undefined): string {
  return String(acceso?.tipoPermiso ?? "").trim().toUpperCase();
}

/** Nombres de rol comparables: el backend no garantiza mayúsculas ni espacios. */
function normNombre(nombre: string | null | undefined): string {
  return String(nombre ?? "").trim().toLowerCase().replace(/\s+/g, " ");
}

/**
 * Roles que surgen de los accesos del usuario. Descarta los tipos que no
 * reconoce en lugar de arriesgar un rol inventado —de un tipo nuevo es
 * preferible no dar acceso a darlo de más— y deduplica.
 */
export function rolesDe(accesos: Acceso[] | undefined): Rol[] {
  if (!Array.isArray(accesos)) return [];
  const roles = accesos.map((a) => POR_TIPO[tipoDe(a)]).filter((r): r is Rol => Boolean(r));
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
export function tienePermiso(accesos: Acceso[] | undefined, permiso: string): boolean {
  if (!Array.isArray(accesos)) return false;
  return accesos.some((a) => Array.isArray(a?.permisos) && a.permisos.includes(permiso));
}

/**
 * Ámbito donde se busca un rol. Los roles no son globales: aplican dentro de un
 * `tipoPermiso` y, cuando ése es PRODUCTOR, dentro de un establecimiento —el
 * mismo criterio de `establecimientosDe`—, porque alguien puede ser
 * "Propietaria" de un establecimiento y no tener nada que ver con otro.
 */
export interface AmbitoRol {
  /** "ADMIN" | "PRODUCTOR" | "VISITANTE". Sin esto vale cualquier tipo. */
  tipoPermiso?: string;
  /** Sólo tiene sentido junto con `tipoPermiso: "PRODUCTOR"`. */
  establecimientoId?: string;
}

/**
 * `true` si la cuenta tiene un acceso con ese nombre de rol dentro del ámbito
 * pedido. Es la pregunta que corresponde cuando lo que habilita una acción es
 * el rol en sí —p. ej. el Administrador Líder— y no un permiso suelto.
 *
 * Como todo lo de este archivo, es control de navegación y no de seguridad: los
 * accesos salen del store persistido y se pueden editar desde el navegador.
 */
export function tieneRol(
  accesos: Acceso[] | undefined,
  rolNombre: string,
  ambito: AmbitoRol = {},
): boolean {
  if (!Array.isArray(accesos)) return false;
  const buscado = normNombre(rolNombre);
  // Sin nombre no hay nada que buscar, y comparar contra "" daría verdadero
  // con cualquier acceso al que le falte el rolNombre.
  if (!buscado) return false;
  const tipo = ambito.tipoPermiso?.trim().toUpperCase();
  const establecimiento = ambito.establecimientoId?.trim();
  return accesos.some(
    (a) =>
      normNombre(a?.rolNombre) === buscado &&
      (!tipo || tipoDe(a) === tipo) &&
      (!establecimiento || a?.establecimientoId === establecimiento),
  );
}

/**
 * `true` si la cuenta tiene algún acceso de ese tipo. Responde si es
 * administradora o productora, no cuál es su rol ni sobre qué establecimiento:
 * para eso están `tieneRol` y `establecimientosDe`.
 *
 * Chequeo de acceso del lado del cliente. Sirve para no mostrar pantallas ni
 * acciones que no corresponden, NO como control de seguridad: los accesos
 * viajan en el store persistido y son editables desde el navegador. Quien tiene
 * que rechazar cada request es el backend.
 */
export function tieneTipoPermiso(roles: Rol[], requerido: Rol): boolean {
  return roles.includes(requerido);
}

/**
 * Nombre del rol para un tipo de acceso, p. ej. "Administrador Líder" para
 * ADMIN. Cadena vacía si la cuenta no tiene un acceso de ese tipo: quien lo
 * muestre decide qué poner en su lugar.
 */
export function nombreRol(accesos: Acceso[] | undefined, tipoPermiso: string): string {
  if (!Array.isArray(accesos)) return "";
  const acceso = accesos.find((a) => tipoDe(a) === tipoPermiso);
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
    .filter((a) => tipoDe(a) === "PRODUCTOR")
    .filter((a) => typeof a?.establecimientoId === "string" && a.establecimientoId.trim() !== "")
    .map((a) => ({
      id: a.establecimientoId as string,
      nombre: a.establecimientoNombre ?? "",
      rolNombre: a.rolNombre ?? "",
    }));
}
