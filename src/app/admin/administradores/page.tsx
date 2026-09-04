import type { Metadata } from "next";
import GuardRol from "@/components/GuardRol";
import AdministradoresClient from "./AdministradoresClient";

export const metadata: Metadata = {
  title: "Administradores · Administración · Mendoza AgroTours",
  description: "Gestioná el equipo de administración del sistema y asigná roles.",
};

export default function AdministradoresPage() {
  // El layout de /admin ya exige el rol; acá se suma el permiso de lectura.
  return (
    <GuardRol rol="admin" permiso="LEER_ADMIN">
      <AdministradoresClient />
    </GuardRol>
  );
}
