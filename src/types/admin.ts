/* ---- Contratos reales de /administradores-sistemas ---------------------- */

/** Item de GET /administradores-sistemas/ y respuesta de .../create. */
export interface AdminSistema {
  id: string;
  nombreUsuario: string;
  emailUsuario: string;
  identificacion: string;
  nombreRol: string;
  esLider: boolean;
}

/** Item de GET /administradores-sistemas/roles. */
export interface RolAdmin {
  id: string;
  nombre: string;
  descripcion: string;
}

/**
 * Item de GET /roles/admin: un rol con los permisos que otorga. `RolAdmin` es
 * la versión corta que llena el selector de la pantalla de administradores;
 * ésta es la que gestiona la pantalla de roles.
 *
 * El endpoint sólo devuelve los roles vigentes, así que no hay campo de baja.
 */
export interface RolAdminDetalle {
  id: string;
  nombre: string;
  descripcion: string;
  /** Códigos sueltos, p. ej. "LEER_ADMIN". Se cruzan contra `GrupoPermiso`. */
  permisos: string[];
  /** Administradores que hoy tienen el rol; con al menos uno no se puede borrar. */
  cantidadUsuarios: number;
  /** Rol de sistema: no se modifica ni se da de baja. */
  esProtegido: boolean;
}

/**
 * Item de GET /permisos/grupos-permisos/admin: el catálogo de permisos que
 * existen, agrupado por recurso. Es la fuente de verdad de qué se puede marcar
 * —los roles sólo traen códigos—, y por eso vive en el backend: agregar un
 * permiso no debería requerir tocar el front.
 */
export interface GrupoPermiso {
  /** Hace de clave: el backend no manda id. */
  nombre: string;
  descripcion: string;
  permisos: string[];
}

/**
 * GET /usuario/card/{email}: sólo confirma que la cuenta existe. No dice si ya
 * es administradora — eso se resuelve comparando la identificación contra la
 * lista vigente.
 */
export interface UsuarioCard {
  nombre: string;
  identificacion: string;
}

/* ---- Mock del resto del panel de administración ------------------------- */

export interface PermItem {
  id: string;
  label: string;
}

export interface PermGroup {
  id: string;
  label: string;
  icon: string;
  desc: string;
  perms: PermItem[];
}

export interface AdminRole {
  id: string;
  nombre: string;
  descripcion: string;
  usuarios: number;
  baja: string | null;
  lider?: boolean;
  perms: string[];
}

export type EstadoAdmin = "activo" | "inactivo";

export interface AdminPerson {
  id: string;
  nombre: string;
  email: string;
  dni: string;
  rolId: string;
  estado: EstadoAdmin;
  lider?: boolean;
}

export interface RegisteredUser {
  email: string;
  nombre: string;
  dni: string;
}

export type EstadoEstab = "activo" | "suspendido";

export interface AdminEstab {
  id: string;
  nombre: string;
  titular: string;
  ubicacion: string;
  actividades: number;
  reservas: number;
  alta: string;
  estado: EstadoEstab;
  motivo?: string;
  suspendido?: string;
  suspendidoPor?: string;
}
