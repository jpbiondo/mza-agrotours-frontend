import type { Metadata } from "next";
import GuardRol from "@/components/GuardRol";
import { PermisoAdmin } from "@/lib/permisos";
import DetalleDeudaClient from "./DetalleDeudaClient";

export const metadata: Metadata = {
  title: "Detalle de la deuda · Administración · Mendoza AgroTours",
  description: "La deuda de un establecimiento con la plataforma y su historial de estados.",
};

export default async function DetalleDeudaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <GuardRol rol="admin" permiso={PermisoAdmin.LEER_DEUDAS}>
      <DetalleDeudaClient id={id} />
    </GuardRol>
  );
}
