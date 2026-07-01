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
  pais: string;
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
    ? { nombre: "Lucía Funes", fechaNac: new Date(1986, 2, 22), tipoIdent: "DNI", identificacion: "32.118.745", telefono: "2614778820", pais: "Argentina" }
    : { nombre: "Camila Ríos", fechaNac: new Date(1994, 6, 15), tipoIdent: "DNI", identificacion: "38.422.190", telefono: "2615558842", pais: "Argentina" };
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
export interface CondicionBaja {
  label: string;
  met: boolean;
  detail: string;
}
export interface CondicionesBaja {
  adminBlock?: boolean;
  intro: string;
  items: CondicionBaja[];
}

export function rolLabel(rol: RolCuenta): string {
  return rol === "productor" ? "productor líder" : rol === "admin" ? "administrador" : "visitante";
}

export function condicionesEliminar(cuenta: CuentaSesion): CondicionesBaja {
  const { rol, condicionesOk } = cuenta;
  if (rol === "admin") {
    return {
      adminBlock: true,
      intro: "Las cuentas con rol de administrador no pueden darse de baja a sí mismas.",
      items: [{ label: "Un administrador no puede autoeliminar su cuenta", met: false, detail: "Pedí a otro administrador del sistema que gestione la baja de tu cuenta." }],
    };
  }
  if (rol === "productor") {
    return {
      intro: "Estado de las condiciones para dar de baja una cuenta de productor líder:",
      items: [{ label: "El establecimiento debe estar dado de baja", met: condicionesOk, detail: condicionesOk ? "Tu establecimiento figura como dado de baja." : "Tu establecimiento «Finca La Escondida» sigue activo. Dalo de baja antes de continuar." }],
    };
  }
  return {
    intro: "Estado de las condiciones para dar de baja tu cuenta de visitante:",
    items: [{ label: "No debés tener reservas en estado «Pendiente»", met: condicionesOk, detail: condicionesOk ? "No tenés reservas en estado Pendiente." : "Tenés 2 reservas en estado Pendiente. Cancelalas o esperá su resolución para continuar." }],
  };
}

/** dd/mm/aaaa HH:MM (convención AR). */
export function fechaHoraBaja(d = new Date()): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
}
