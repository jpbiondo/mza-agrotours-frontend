import type { Metadata } from "next";
import GuardRol from "@/components/GuardRol";
import { PermisoAdmin } from "@/lib/permisos";
import FaqAdminClient from "./FaqAdminClient";

export const metadata: Metadata = {
  title: "Preguntas frecuentes · Administración · Mendoza AgroTours",
  description: "Mantené la base de conocimiento que consultan los usuarios.",
};

export default function FaqAdminPage() {
  return (
    <GuardRol rol="admin" permiso={PermisoAdmin.GESTIONAR_FAQ}>
      <FaqAdminClient />
    </GuardRol>
  );
}
