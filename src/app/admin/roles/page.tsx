import type { Metadata } from "next";
import GuardRol from "@/components/GuardRol";
import { PermisoAdmin } from "@/lib/permisos";
import RolesClient from "./RolesClient";

export const metadata: Metadata = {
  title: "Roles de administrador · Administración · Mendoza AgroTours",
  description: "Creá roles para el equipo de administración y definí sus permisos.",
};

export default function RolesPage() {
  // El layout de /admin ya exige el rol; acá se suma el permiso de lectura.
  return (
    <GuardRol rol="admin" permiso={PermisoAdmin.LEER_ROLES_ADMIN}>
      <RolesClient />
    </GuardRol>
  );
}
