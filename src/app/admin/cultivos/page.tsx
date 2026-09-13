import type { Metadata } from "next";
import GuardRol from "@/components/GuardRol";
import { PermisoAdmin } from "@/lib/permisos";
import CultivosClient from "./CultivosClient";

export const metadata: Metadata = {
  title: "Cultivos · Administración · Mendoza AgroTours",
  description: "Administrá el catálogo de cultivos de la plataforma.",
};

export default function CultivosPage() {
  return (
    <GuardRol rol="admin" permiso={PermisoAdmin.LEER_CULTIVOS}>
      <CultivosClient />
    </GuardRol>
  );
}
