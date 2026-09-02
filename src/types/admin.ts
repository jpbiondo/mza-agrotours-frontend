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

export type EstadoEstab = "activo" | "suspendido";

/**
 * Estado actual de un establecimiento con su sello: quién lo dejó así, cuándo y
 * por qué. Va aparte porque es lo único que devuelven las dos operaciones sobre
 * la suspensión, sin los contadores.
 */
export interface EstadoAdminEstab {
  estado: EstadoEstab;
  /**
   * Motivo del estado actual. Sólo tiene sentido mostrarlo en los suspendidos:
   * al reactivar, el backend lo pisa con "Reactivación de establecimiento".
   */
  motivoEstado: string;
  /** Cuándo pasó a este estado (ISO), o null si el backend no lo mandó. */
  fechaEstado: string | null;
  /** Administrador que lo dejó en este estado. Vacío si lo cambió el sistema. */
  ejecutorEstado: string;
}

/** Item de GET /admin/establecimientos. */
export interface AdminEstab extends EstadoAdminEstab {
  id: string;
  nombre: string;
  /** Nombre del productor líder del establecimiento. */
  productorLider: string;
  /** Nombre del departamento; la provincia es siempre Mendoza. */
  departamento: string;
  /** Fecha del alta (ISO), o null si el backend no la mandó. */
  fechaAlta: string | null;
  /** Actividades publicadas hoy. */
  actividades: number;
  /** Reservas históricas, no las vigentes. */
  reservas: number;
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

