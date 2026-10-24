import type { Metadata } from "next";
import GuardRol from "@/components/GuardRol";
import { PermisoAdmin } from "@/lib/permisos";
import ParametrosClient from "./ParametrosClient";

export const metadata: Metadata = {
  title: "Parámetros del sistema · Administración · Mendoza AgroTours",
  description: "Consultá y modificá la configuración financiera y las reglas de operación de la plataforma.",
};

export default function ParametrosPage() {
  return (
    <GuardRol rol="admin" permiso={PermisoAdmin.LEER_PARAMETROS}>
      <ParametrosClient />
    </GuardRol>
  );
}
