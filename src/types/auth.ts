export type Rol = "visitante" | "productor" | "admin";

/** Datos del usuario que devuelve el backend en el campo `data`. */
export interface BackendProfile {
  nombre: string;
  email: string;
  telefono: string;
  identificacion: string;
  tipoIdentificacion: string;
  /** Fecha de nacimiento en ISO (o null si el backend no la tiene). */
  fechaNacimiento: string | null;
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
