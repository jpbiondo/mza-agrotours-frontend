import type { Metadata } from "next";
import GuardRol from "@/components/GuardRol";
import { PermisoAdmin } from "@/lib/permisos";
import DetalleReembolsoClient from "./DetalleReembolsoClient";

export const metadata: Metadata = {
  title: "Detalle del reembolso · Administración · Mendoza AgroTours",
  description: "El reembolso, su reserva y los datos para contactar al visitante y al productor.",
};

export default async function DetalleReembolsoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <GuardRol rol="admin" permiso={PermisoAdmin.LEER_REEMBOLSOS}>
      <DetalleReembolsoClient id={id} />
    </GuardRol>
  );
}
