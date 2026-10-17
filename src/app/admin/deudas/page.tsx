import type { Metadata } from "next";
import GuardRol from "@/components/GuardRol";
import { PermisoAdmin } from "@/lib/permisos";
import DeudasClient from "./DeudasClient";

export const metadata: Metadata = {
  title: "Deudas de productores · Administración · Mendoza AgroTours",
  description: "Deudas de las fincas con la plataforma por reembolsos cubiertos por el sistema.",
};

export default function DeudasPage() {
  return (
    <GuardRol rol="admin" permiso={PermisoAdmin.LEER_DEUDAS}>
      <DeudasClient />
    </GuardRol>
  );
}
