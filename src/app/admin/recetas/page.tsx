import type { Metadata } from "next";
import GuardRol from "@/components/GuardRol";
import { PermisoAdmin } from "@/lib/permisos";
import RecetasClient from "./RecetasClient";

export const metadata: Metadata = {
  title: "Recetas · Administración · Mendoza AgroTours",
  description: "Administrá el recetario de la plataforma, asociado a los cultivos.",
};

export default function RecetasPage() {
  return (
    <GuardRol rol="admin" permiso={PermisoAdmin.LEER_RECETAS}>
      <RecetasClient />
    </GuardRol>
  );
}
