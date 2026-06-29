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
