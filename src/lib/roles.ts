import type { Rol } from "@/types/auth";

/** `tipoPermisos` de GET /usuario/me → rol interno. */
const POR_PERMISO: Record<string, Rol> = {
  ADMIN: "admin",
  PRODUCTOR: "productor",
  VISITANTE: "visitante",
};

/**
 * Normaliza la lista de permisos del backend. Descarta lo que no reconoce en
 * lugar de arriesgar un rol inventado —de un permiso nuevo es preferible no dar
 * acceso a darlo de más— y deduplica.
 */
export function aRoles(tipoPermisos: unknown): Rol[] {
  if (!Array.isArray(tipoPermisos)) return [];
  const roles = tipoPermisos
    .map((p) => POR_PERMISO[String(p ?? "").trim().toUpperCase()])
    .filter((r): r is Rol => Boolean(r));
  return [...new Set(roles)];
}

/**
 * Chequeo de acceso del lado del cliente. Sirve para no mostrar pantallas que
 * no corresponden, NO como control de seguridad: los roles viajan en el store
 * persistido y son editables desde el navegador. Quien tiene que rechazar cada
 * request es el backend.
 */
export function tieneRol(roles: Rol[], requerido: Rol): boolean {
  return roles.includes(requerido);
}
