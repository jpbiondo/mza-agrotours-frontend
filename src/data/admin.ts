import type { AdminEstab, AdminPerson, AdminRole, PermGroup, RegisteredUser } from "@/types/admin";

/* ---- Árbol de permisos del administrador del sistema ------------------- */
export const ADMIN_PERM_GROUPS: PermGroup[] = [
  {
    id: "administradores", label: "Gestión de administradores", icon: "user-cog",
    desc: "Altas, bajas y cambios de rol de los administradores del sistema.",
    perms: [
      { id: "adm_ver", label: "Ver administradores" },
      { id: "adm_abm", label: "Agregar y dar de baja administradores" },
      { id: "adm_rol", label: "Cambiar el rol de un administrador" },
    ],
  },
  {
    id: "roles", label: "Gestión de roles de administrador", icon: "shield-check",
    desc: "Definir qué puede hacer cada administrador del sistema.",
    perms: [
      { id: "rol_ver", label: "Ver roles de administrador" },
      { id: "rol_crear", label: "Crear y modificar roles" },
      { id: "rol_baja", label: "Dar de baja roles" },
    ],
  },
  {
    id: "establecimientos", label: "Gestión de establecimientos", icon: "warehouse",
    desc: "Supervisar y moderar los establecimientos de la plataforma.",
    perms: [
      { id: "est_ver", label: "Ver establecimientos" },
      { id: "est_susp", label: "Suspender establecimientos" },
      { id: "est_react", label: "Reactivar establecimientos" },
    ],
  },
];

export const ADMIN_ALL_PERMS = ADMIN_PERM_GROUPS.flatMap((g) => g.perms.map((p) => p.id));
export const ADMIN_PERM_LABEL: Record<string, string> = Object.fromEntries(ADMIN_PERM_GROUPS.flatMap((g) => g.perms.map((p) => [p.id, p.label])));

export const ADMIN_SEED_ROLES: AdminRole[] = [
  { id: "ar1", nombre: "Administrador líder", descripcion: "Acceso total al sistema. Único rol que puede gestionar a otros administradores líderes.", usuarios: 1, baja: null, lider: true, perms: ADMIN_ALL_PERMS.slice() },
  { id: "ar2", nombre: "Moderador de establecimientos", descripcion: "Supervisa y suspende establecimientos que incumplen las normas.", usuarios: 2, baja: null, perms: ["est_ver", "est_susp", "est_react", "adm_ver"] },
  { id: "ar3", nombre: "Soporte de administradores", descripcion: "Gestiona el alta y los roles de los administradores del sistema.", usuarios: 1, baja: null, perms: ["adm_ver", "adm_abm", "adm_rol", "rol_ver"] },
  { id: "ar4", nombre: "Auditor", descripcion: "Acceso de solo lectura a todo el sistema, sin acciones.", usuarios: 0, baja: null, perms: ["adm_ver", "rol_ver", "est_ver"] },
  { id: "ar5", nombre: "Moderador de prueba", descripcion: "Rol temporal usado durante la puesta en marcha.", usuarios: 0, baja: "08/05/2026 · 10:15", perms: ["est_ver"] },
];

export const ADMIN_ROLE_BY_ID: Record<string, AdminRole> = Object.fromEntries(ADMIN_SEED_ROLES.map((r) => [r.id, r]));

export const ADMIN_REGISTERED_USERS: RegisteredUser[] = [
  { email: "diego.ferreyra@mendozaagrotours.gob.ar", nombre: "Diego Ferreyra", dni: "26.118.940" },
  { email: "paula.bianchi@mendozaagrotours.gob.ar", nombre: "Paula Bianchi", dni: "31.504.221" },
  { email: "rodrigo.salas@mendozaagrotours.gob.ar", nombre: "Rodrigo Salas", dni: "29.870.115" },
  { email: "florencia.aguirre@mendozaagrotours.gob.ar", nombre: "Florencia Aguirre", dni: "33.221.768" },
  { email: "tomas.peralta@mendozaagrotours.gob.ar", nombre: "Tomás Peralta", dni: "28.945.302" },
  { email: "noelia.vega@mendozaagrotours.gob.ar", nombre: "Noelia Vega", dni: "30.662.401" },
  { email: "martin.olguin@mendozaagrotours.gob.ar", nombre: "Martín Olguín", dni: "27.330.118" },
  { email: "valentina.rios@mendozaagrotours.gob.ar", nombre: "Valentina Ríos", dni: "34.789.255" },
  { email: "lucas.medina@mendozaagrotours.gob.ar", nombre: "Lucas Medina", dni: "32.107.643" },
];

export const ADMIN_SEED_PEOPLE: AdminPerson[] = [
  { id: "a1", nombre: "Diego Ferreyra", email: "diego.ferreyra@mendozaagrotours.gob.ar", dni: "26.118.940", rolId: "ar1", estado: "activo", lider: true },
  { id: "a2", nombre: "Paula Bianchi", email: "paula.bianchi@mendozaagrotours.gob.ar", dni: "31.504.221", rolId: "ar2", estado: "activo" },
  { id: "a3", nombre: "Rodrigo Salas", email: "rodrigo.salas@mendozaagrotours.gob.ar", dni: "29.870.115", rolId: "ar2", estado: "activo" },
  { id: "a4", nombre: "Florencia Aguirre", email: "florencia.aguirre@mendozaagrotours.gob.ar", dni: "33.221.768", rolId: "ar3", estado: "activo" },
  { id: "a5", nombre: "Tomás Peralta", email: "tomas.peralta@mendozaagrotours.gob.ar", dni: "28.945.302", rolId: "ar4", estado: "activo" },
];

export const ADMIN_SEED_ESTAB: AdminEstab[] = [
  { id: "e1", nombre: "Finca La Escondida", titular: "Lucía Funes", ubicacion: "Luján de Cuyo, Mendoza", actividades: 8, reservas: 142, alta: "12/03/2024", estado: "activo" },
  { id: "e2", nombre: "Finca Los Álamos", titular: "Mateo Quiroga", ubicacion: "Maipú, Mendoza", actividades: 5, reservas: 87, alta: "04/07/2024", estado: "activo" },
  { id: "e3", nombre: "Bodega Viento Sur", titular: "Sofía Iglesias", ubicacion: "Valle de Uco, Tunuyán", actividades: 11, reservas: 203, alta: "21/01/2024", estado: "activo" },
  { id: "e4", nombre: "Finca El Cerezal", titular: "Joaquín Méndez", ubicacion: "San Rafael, Mendoza", actividades: 3, reservas: 19, alta: "15/09/2025", estado: "suspendido", motivo: "Reiteradas cancelaciones sin reembolso a los visitantes. Suspendido hasta regularizar la situación.", suspendido: "10/06/2026 · 16:30", suspendidoPor: "Paula Bianchi" },
  { id: "e5", nombre: "Olivícola Don Aldo", titular: "Renata Vidal", ubicacion: "Maipú, Mendoza", actividades: 4, reservas: 56, alta: "30/11/2024", estado: "activo" },
  { id: "e6", nombre: "Finca Sol de Agosto", titular: "Ignacio Sosa", ubicacion: "Tupungato, Mendoza", actividades: 2, reservas: 8, alta: "02/02/2026", estado: "activo" },
];

export function admInitials(nombre: string): string {
  const parts = (nombre || "").trim().split(/\s+/);
  return ((parts[0]?.[0] || "") + (parts[1]?.[0] || "")).toUpperCase();
}

export function estabInitials(name: string): string {
  const skip = new Set(["finca", "bodega", "olivícola", "la", "el", "los", "las", "de", "del"]);
  const w = name.split(/\s+/).filter((x) => x && !skip.has(x.toLowerCase()));
  return w.slice(0, 2).map((x) => x[0]).join("").toUpperCase();
}
