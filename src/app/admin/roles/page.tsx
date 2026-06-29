import type { Metadata } from "next";
import RolesClient from "./RolesClient";

export const metadata: Metadata = {
  title: "Roles de administrador · Administración · Mendoza AgroTours",
  description: "Creá roles para el equipo de administración y definí sus permisos.",
};

export default function RolesPage() {
  return <RolesClient />;
}
