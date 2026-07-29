import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
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
    <div className="min-h-screen bg-cream-bg">
      <SiteHeader active="mis-solicitudes" />
      <SolicitudDetalleClient id={id} />
    </div>
  );
}
