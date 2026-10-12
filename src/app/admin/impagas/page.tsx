import type { Metadata } from "next";
import GuardRol from "@/components/GuardRol";
import { PermisoAdmin } from "@/lib/permisos";
import ImpagasClient from "./ImpagasClient";

export const metadata: Metadata = {
  title: "Reservas impagas · Administración · Mendoza AgroTours",
  description: "Reembolsos que los productores deben a los visitantes.",
};

export default function ImpagasPage() {
  return (
    <GuardRol rol="admin" permiso={PermisoAdmin.LEER_REEMBOLSOS}>
      <ImpagasClient />
    </GuardRol>
  );
}
