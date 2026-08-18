import type { Rol } from "@/types/auth";

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Nombres: letras (con acentos y ñ), marcas de acento, espacios, guiones y
 *  apóstrofos (Ana-María, O'Brien). Sin números ni otros caracteres especiales. */
export const NOMBRE_RE = /^[\p{L}\p{M}\s'’-]+$/u;

/** Forma de las cuentas mock (demo/recuperación); desacoplada del tipo Cuenta real. */
interface CuentaMock {
  email: string;
  password: string;
  nombre: string;
  rol: Rol;
  /** Fecha ISO de baja; si no es null, la cuenta fue eliminada. */
  fechaBaja: string | null;
}

/** Cuentas registradas. fechaBaja !== null → cuenta dada de baja. */
export const CUENTAS: CuentaMock[] = [
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

export interface Destino {
  label: string;
  sub: string;
  href: string;
}

/**
 * Destino por defecto post-login. Como por ahora el usuario tiene todos los roles,
 * aterriza en "Explorar"; los paneles de productor/admin se alcanzan desde el navbar.
 */
export const DESTINO_DEFAULT: Destino = {
  label: "Explorar experiencias",
  sub: "Inicio",
  href: "/explorar",
};

/** ¿Existe el correo de una cuenta activa? (para recuperación de contraseña) */
export function existeCorreo(email: string): boolean {
  const e = (email || "").trim().toLowerCase();
  return CUENTAS.some((c) => c.email.toLowerCase() === e && c.fechaBaja === null);
}