export type Rol = "visitante" | "productor";

export interface Cuenta {
  email: string;
  password: string;
  nombre: string;
  rol: Rol;
  /** Fecha ISO de baja; si no es null, la cuenta fue eliminada. */
  fechaBaja: string | null;
}

export interface Credenciales {
  email: string;
  password: string;
}

/** Resultado de la autenticación. */
export type AuthCode = "ok" | "badCreds" | "baja";

export interface AuthResult {
  ok: boolean;
  code: AuthCode;
  cuenta?: Cuenta;
}