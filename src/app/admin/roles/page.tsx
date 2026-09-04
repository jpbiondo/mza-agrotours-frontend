import type { Metadata } from "next";
import GuardRol from "@/components/GuardRol";
import RolesClient from "./RolesClient";

export const metadata: Metadata = {
  title: "Roles de administrador · Administración · Mendoza AgroTours",
  description: "Creá roles para el equipo de administración y definí sus permisos.",
};

export default function RolesPage() {
  // El layout de /admin ya exige el rol; acá se suma el permiso de lectura.
  return (
    <GuardRol rol="admin" permiso="LEER_ROL">
      <RolesClient />
    </GuardRol>
  );
}
