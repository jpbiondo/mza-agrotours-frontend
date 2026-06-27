import type { Cuenta, Rol, AuthResult } from "@/types/auth";

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Cuentas registradas. fechaBaja !== null → cuenta dada de baja. */
export const CUENTAS: Cuenta[] = [
  {
    email: "camila.rios@gmail.com",
    password: "Cosecha#26",
    nombre: "Camila Ríos",
    rol: "visitante",
    fechaBaja: null,
  },
  {
    email: "productor@fincalaescondida.com.ar",
    password: "Vendimia.2026",
    nombre: "Lucía Funes",
    rol: "productor",
    fechaBaja: null,
  },
  {
    email: "baja@gmail.com",
    password: "Tierra*2024",
    nombre: "Mario Sosa",
    rol: "visitante",
    fechaBaja: "2026-03-12",
  },
];

/** Credenciales de prueba mostradas en la ayuda de la demo. */
export const CREDENCIALES_DEMO = [
  { rol: "Visitante", email: "camila.rios@gmail.com", password: "Cosecha#26" },
  { rol: "Productor", email: "productor@fincalaescondida.com.ar", password: "Vendimia.2026" },
  { rol: "Cuenta dada de baja", email: "baja@gmail.com", password: "Tierra*2024" },
] as const;

export interface Destino {
  label: string;
  sub: string;
  href: string;
}

/** Destino post-login según el rol (AC: "ingresar al sistema según mi rol"). */
export const DESTINO_POR_ROL: Record<Rol, Destino> = {
  visitante: { label: "Explorar experiencias", sub: "Inicio", href: "/explorar" },
  productor: { label: "Panel de productor", sub: "Panel de productor", href: "/panel" },
};

/**
 * Autentica unas credenciales contra las cuentas mock.
 * code ∈ 'ok' | 'badCreds' | 'baja'
 */
export function autenticar(email: string, password: string): AuthResult {
  const e = (email || "").trim().toLowerCase();
  const cuenta = CUENTAS.find((c) => c.email.toLowerCase() === e);
  if (!cuenta || cuenta.password !== password) {
    return { ok: false, code: "badCreds" };
  }
  if (cuenta.fechaBaja !== null) {
    return { ok: false, code: "baja", cuenta };
  }
  return { ok: true, code: "ok", cuenta };
}

/** ¿Existe el correo de una cuenta activa? (para recuperación de contraseña) */
export function existeCorreo(email: string): boolean {
  const e = (email || "").trim().toLowerCase();
  return CUENTAS.some((c) => c.email.toLowerCase() === e && c.fechaBaja === null);
}