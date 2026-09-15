import type { Rol } from "@/types/auth";

export interface Perfil {
  nombre: string;
  fechaNac: Date | null;
  tipoIdent: string;
  identificacion: string;
  email: string;
  telefono: string;
  paisIso2: string;
}

/** Cuenta en sesión, tal como la devuelve `GET /usuario/me`. */
export interface CuentaSesion {
  nombre: string;
  email: string;
  roles: Rol[];
}

/* ---- Condiciones para dar de baja la cuenta ---------------------------- */
/** Condición incumplida devuelta por el backend (GET meets-delete-conditions). */
export interface CondicionIncumplida {
  nombre: string;
  descripcion: string;
}

/** dd/mm/aaaa HH:MM (convención AR). */
export function fechaHoraBaja(d = new Date()): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
}
