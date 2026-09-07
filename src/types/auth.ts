export type Rol = "visitante" | "productor" | "admin";

export interface EstablecimientoRef {
  id: string;
  nombre: string;
  /** "ACTIVO" | "SUSPENDIDO"; leerlo con los helpers de `lib/roles`. */
  estado?: string | null;
}

export interface SuspensionAcceso {
  motivo: string | null;
  fechaHoraFin: string;
}

/**
 * Un rol del usuario junto con los permisos que ese rol le da. Un mismo usuario
 * puede tener varios: uno de ADMIN y uno por establecimiento como PRODUCTOR.
 */
export interface Acceso {
  rolId: string;
  rolNombre: string;
  /** Un `TipoPermiso` del backend; normalizar con `rolesDe`. */
  tipoPermiso: string;
  /** Permisos finos del rol, p. ej. "LEER_ADMIN", "GESTIONAR_ADMIN". */
  permisos: string[];
  /** Sólo en accesos de PRODUCTOR; `null` en los de ADMIN y VISITANTE. */
  establecimiento: EstablecimientoRef | null;
  /** `null` cuando el productor no está suspendido en ese establecimiento. */
  suspension: SuspensionAcceso | null;
}

/** Datos del usuario que devuelve el backend en el campo `data`. */
export interface BackendProfile {
  nombre: string;
  email: string;
  telefono: string;
  identificacion: string;
  tipoIdentificacion: string;
  /** Fecha de nacimiento en ISO (o null si el backend no la tiene). */
  fechaNacimiento: string | null;
  /** Roles del usuario con sus permisos. Derivar con `rolesDe` / `puede`. */
  accesos?: Acceso[];
}

/**
 * Usuario en sesión: el perfil del backend + los roles.
 * No incluye password (Firebase es dueño de la credencial).
 */
export interface Cuenta extends BackendProfile {
  roles: Rol[];
}

export interface Credenciales {
  email: string;
  password: string;
}

/**
 * Resultado de la autenticación.
 * - `badCreds` / `baja`: resultados de dominio (Firebase o backend).
 * - `error`: fallo técnico (red, backend caído) — mensaje genérico en la UI.
 */
export type AuthCode = "ok" | "badCreds" | "baja" | "error";

export interface AuthResult {
  ok: boolean;
  code: AuthCode;
  cuenta?: Cuenta;
}
