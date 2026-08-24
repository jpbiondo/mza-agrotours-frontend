"use client";

import { UserCog } from "lucide-react";
import AsyncBoundary from "@/components/AsyncBoundary";
import { RolesScreen, RolesSkeleton } from "@/components/roles/RolesScreen";
import type { TextosRoles } from "@/components/roles/textos";
import { TipoPermiso } from "@/lib/permisos";
import { ROL_ADMIN_LIDER, tieneRol } from "@/lib/roles";
import { useRoles, useRolesCrudAdmin } from "@/hooks/useRoles";
import { useAuthStore } from "@/stores/authStore";

/** Un rol de administrador se asigna a administradores del sistema. */
const TEXTOS: TextosRoles = {
  breadcrumb: ["Acceso", "Roles de administrador"],
  titulo: "Roles de administrador",
  bajada:
    "Creá roles para el equipo de administración y elegí qué puede hacer cada uno dentro del sistema.",
  columnaRol: "Rol de administrador",
  columnaUsuarios: "Administradores",
  statUsuarios: "Administradores con rol",
  iconoUsuarios: UserCog,
  vacio: "Todavía no hay roles de administrador.",
  sinGestion: "Sólo el Administrador Líder puede gestionar los roles",
  usuariosAsignados: (n) => `${n} ${n === 1 ? "administrador asignado" : "administradores asignados"}`,
  notaBorrar: "No se puede borrar con administradores",
  bajaAdvertencia: "Dejará de estar disponible para asignar a nuevos administradores.",
  form: {
    tituloCrear: "Crear rol de administrador",
    bajadaCrear: "Definí qué puede hacer un administrador con este rol.",
    nombrePlaceholder: "Ej. Moderador de establecimientos",
    nombreAyuda: "Así verán este rol el resto de los administradores.",
    descPlaceholder: "Contá para qué sirve este rol dentro del sistema.",
    maxNombre: 40,
  },
};

export default function RolesClient() {
  const { roles, grupos, isLoading, error, reload } = useRoles();
  const acciones = useRolesCrudAdmin();
  // LEER_ROLES_ADMIN ya lo exige el guard de la ruta; acá se distingue quién
  // puede actuar, y eso no lo da un permiso suelto sino el rol: crear,
  // modificar y dar de baja roles es atribución del Administrador Líder.
  const accesos = useAuthStore((s) => s.accesos);
  const gestionar = tieneRol(accesos, ROL_ADMIN_LIDER, { tipoPermiso: TipoPermiso.ADMIN });

  return (
    <AsyncBoundary
      loading={isLoading}
      error={error}
      onRetry={reload}
      skeleton={<RolesSkeleton textos={TEXTOS} />}
    >
      <RolesScreen
        initial={roles}
        grupos={grupos}
        textos={TEXTOS}
        acciones={acciones}
        puedeGestionar={gestionar}
      />
    </AsyncBoundary>
  );
}
