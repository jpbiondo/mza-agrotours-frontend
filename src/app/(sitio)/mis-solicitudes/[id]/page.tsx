import type { Metadata } from "next";
import GuardSesion from "@/components/GuardSesion";
import SolicitudDetalleClient from "./SolicitudDetalleClient";

export const metadata: Metadata = {
  title: "Detalle de la solicitud · Mendoza AgroTours",
  description:
    "Revisá los datos y la documentación que enviaste, y el estado de la verificación.",
};

export default async function SolicitudDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <GuardSesion>
      <SolicitudDetalleClient id={id} />
    </GuardSesion>
  );
}
