"use client";

import { Users } from "lucide-react";
import AsyncBoundary from "@/components/AsyncBoundary";
import { SinPermiso } from "@/components/GuardRol";
import { RolesScreen, RolesSkeleton } from "@/components/roles/RolesScreen";
import type { TextosRoles } from "@/components/roles/textos";
import { TipoPermiso } from "@/lib/permisos";
import { ROL_PRODUCTOR_LIDER, tieneRol } from "@/lib/roles";
import type { AmbitoRol } from "@/lib/roles";
import { useEstablecimientos } from "@/hooks/useEstablecimientos";
import { rolesDeEstablecimiento, useRolesCrud, useRolesProductor } from "@/hooks/useRoles";
import { useAuthStore } from "@/stores/authStore";
import EmptyEstablecimiento from "../../EmptyEstablecimiento";

/** Un rol de productor se asigna al personal de la finca. */
const TEXTOS: TextosRoles = {
  breadcrumb: ["Equipo", "Roles y permisos"],
  titulo: "Gestionar roles de productores",
  bajada: "Creá roles para tu personal y elegí qué puede hacer cada uno dentro de la finca.",
  columnaRol: "Nombre del rol",
  columnaUsuarios: "Usuarios asignados",
  statUsuarios: "Usuarios con rol",
  iconoUsuarios: Users,
  vacio: "Todavía no hay roles en este establecimiento.",
  sinGestion: "Sólo el Productor Líder puede gestionar los roles",
  usuariosAsignados: (n) => `${n} ${n === 1 ? "usuario asignado" : "usuarios asignados"}`,
  notaBorrar: "No se puede borrar con usuarios",
  bajaAdvertencia: "Dejará de estar disponible para asignar a nuevo personal.",
  form: {
    tituloCrear: "Crear rol",
    bajadaCrear: "Definí qué puede hacer el personal con este rol.",
    nombrePlaceholder: "Ej. Coordinador de reservas",
    nombreAyuda: "Así lo verá el resto del personal de la finca.",
    descPlaceholder: "Contá para qué sirve este rol dentro de la finca.",
    maxNombre: 30,
  },
};

const SIN_ACCESO =
  "Sólo el Productor Líder puede ver y gestionar los roles. Pedíselo al Productor Líder de la finca.";

/**
 * Roles del establecimiento activo, sólo para su Productor Líder. A diferencia
 * de /admin, acá el acceso no se puede resolver en la ruta: el rol de PRODUCTOR
 * vale por establecimiento y cuál está activo lo elige el switcher del shell,
 * del lado del cliente. Por eso el chequeo vive acá y no en un <GuardRol>.
 */
export default function RolesClient() {
  const { activo } = useEstablecimientos();
  const establecimientoId = activo?.id ?? "";
  const accesos = useAuthStore((s) => s.accesos);

  // Todo se pregunta contra este establecimiento: alguien puede ser líder de una
  // finca y no tener nada que ver con otra.
  const ambito: AmbitoRol = {
    tipoPermiso: TipoPermiso.PRODUCTOR,
    establecimientoId,
  };
  const esLider = tieneRol(accesos, ROL_PRODUCTOR_LIDER, ambito);

  // Sin ser líder no se pide nada: la pantalla ya sabe que no corresponde mostrarla.
  const { roles, grupos, isLoading, error, reload } = useRolesProductor(esLider ? establecimientoId : "");
  const acciones = useRolesCrud(rolesDeEstablecimiento(establecimientoId));

  if (!activo) return <EmptyEstablecimiento />;
  if (!esLider) return <SinPermiso motivo={SIN_ACCESO} />;

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
        puedeGestionar
      />
    </AsyncBoundary>
  );
}
