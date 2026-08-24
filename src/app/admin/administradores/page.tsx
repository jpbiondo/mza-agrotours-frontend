import type { Metadata } from "next";
import GuardRol from "@/components/GuardRol";
import { PermisoAdmin } from "@/lib/permisos";
import AdministradoresClient from "./AdministradoresClient";

export const metadata: Metadata = {
  title: "Administradores · Administración · Mendoza AgroTours",
  description: "Gestioná el equipo de administración del sistema y asigná roles.",
};

export default function AdministradoresPage() {
  // El layout de /admin ya exige el rol; acá se suma el permiso de lectura.
  return (
    <GuardRol rol="admin" permiso={PermisoAdmin.LEER_ADMIN}>
      <AdministradoresClient />
    </GuardRol>
  );
}
