import type { Metadata } from "next";
import GuardRol from "@/components/GuardRol";
import { PermisoAdmin } from "@/lib/permisos";
import EstablecimientosAdminClient from "./EstablecimientosAdminClient";

export const metadata: Metadata = {
  title: "Establecimientos · Administración · Mendoza AgroTours",
  description: "Supervisá, suspendé y reactivá los establecimientos de la plataforma.",
};

export default function EstablecimientosAdminPage() {
  return (
    <GuardRol rol="admin" permiso={PermisoAdmin.LEER_ESTABLECIMIENTO}>
      <EstablecimientosAdminClient />
    </GuardRol>
  );
}
