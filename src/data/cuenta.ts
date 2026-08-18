import { EMAIL_RE } from "@/data/auth";

/** Los administradores no se autoeliminan, pero contemplamos el rol. */
export type RolCuenta = "visitante" | "productor" | "admin";

export interface Perfil {
  nombre: string;
  fechaNac: Date | null;
  tipoIdent: string;
  identificacion: string;
  email: string;
  telefono: string;
  paisIso2: string;
}

/** Cuenta en sesión (mock). En stateless demo, por defecto un visitante. */
export interface CuentaSesion {
  nombre: string;
  email: string;
  rol: RolCuenta;
  /** Se cumplen las condiciones de dominio para darse de baja. */
  condicionesOk: boolean;
}

export const CUENTA_ACTUAL: CuentaSesion = {
  nombre: "Camila Ríos",
  email: "camila.rios@gmail.com",
  rol: "visitante",
  condicionesOk: true,
};

/** Perfil precargado según la cuenta en sesión. */
export function perfilInicial(cuenta: CuentaSesion): Perfil {
  const base = cuenta.rol === "productor"
    ? { nombre: "Lucía Funes", fechaNac: new Date(1986, 2, 22), tipoIdent: "DNI", identificacion: "32.118.745", telefono: "2614778820", paisIso2: "AR" }
    : { nombre: "Camila Ríos", fechaNac: new Date(1994, 6, 15), tipoIdent: "DNI", identificacion: "38.422.190", telefono: "2615558842", paisIso2: "AR" };
  return { ...base, email: cuenta.email };
}

/** Valida todos los campos del perfil → { campo: mensaje }. */
export function validarPerfil(v: Perfil): Partial<Record<keyof Perfil, string>> {
  const e: Partial<Record<keyof Perfil, string>> = {};
  const nombre = (v.nombre || "").trim();
  if (!nombre) e.nombre = "Este campo es obligatorio";
  else if (nombre.length > 40) e.nombre = "Máximo 40 caracteres";

  if (!v.fechaNac) e.fechaNac = "Este campo es obligatorio";
  else {
    const hoy = new Date();
    const min = new Date(hoy.getFullYear() - 120, hoy.getMonth(), hoy.getDate());
    if (v.fechaNac > hoy) e.fechaNac = "La fecha debe ser del pasado";
    else if (v.fechaNac < min) e.fechaNac = "No puede ser anterior a hace 120 años";
  }

  if (!v.tipoIdent) e.tipoIdent = "Seleccioná un tipo de identificación";

  const ident = (v.identificacion || "").trim();
  if (!ident) e.identificacion = "Este campo es obligatorio";
  else if (ident.length > 20) e.identificacion = "Máximo 20 caracteres";

  const email = (v.email || "").trim();
  if (!email) e.email = "Este campo es obligatorio";
  else if (email.length > 100) e.email = "Máximo 100 caracteres";
  else if (!EMAIL_RE.test(email)) e.email = "Ingresá un email válido (nombre@dominio.com)";

  const tel = (v.telefono || "").trim();
  if (!tel) e.telefono = "Este campo es obligatorio";
  else if (!/^\d{7,16}$/.test(tel)) e.telefono = "Ingresá entre 7 y 16 dígitos";

  return e;
}

/* ---- Condiciones para dar de baja la cuenta ---------------------------- */
/** Condición incumplida devuelta por el backend (GET meets-delete-conditions).
 *  `nombre` es un código; `descripcion` es el texto del backend (respaldo). */
export interface CondicionIncumplida {
  nombre: string;
  descripcion: string;
}

/** Copia (título + detalle) por cada `nombre` conocido; para códigos nuevos usa
 *  la `descripcion` del backend como respaldo. */
const COPY_CONDICION: Record<string, { label: string; detail: string }> = {
  reservasActivas: {
    label: "No debés tener reservas en estado «Pendiente»",
    detail:
      "Tenés reservas en estado Pendiente. Cancelalas o esperá su resolución para continuar.",
  },
  administradorSistemas: {
    label: "Un administrador no puede autoeliminar su cuenta",
    detail:
      "Pedí a otro administrador del sistema que gestione la baja de tu cuenta.",
  },
};

export function condicionIncumplidaMsg(c: CondicionIncumplida): {
  label: string;
  detail: string;
} {
  return (
    COPY_CONDICION[c.nombre] ?? { label: c.descripcion, detail: c.descripcion }
  );
}

/** Bloqueo "duro" (no algo que el usuario pueda resolver): cuenta de admin. */
export function esBloqueoAdmin(condiciones: CondicionIncumplida[]): boolean {
  return condiciones.some((c) => c.nombre === "administradorSistemas");
}

export function rolLabel(rol: RolCuenta): string {
  return rol === "productor" ? "productor líder" : rol === "admin" ? "administrador" : "visitante";
}

/** dd/mm/aaaa HH:MM (convención AR). */
export function fechaHoraBaja(d = new Date()): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
}
