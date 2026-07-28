import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
import SolicitarAltaClient from "./SolicitarAltaClient";

export const metadata: Metadata = {
  title: "Solicitar alta de establecimiento · Mendoza AgroTours",
  description:
    "Solicitá el alta de un nuevo establecimiento para crear experiencias agroturísticas en Mendoza.",
};

export default function SolicitarAltaPage() {
  return (
    <div className="min-h-screen bg-cream-bg">
      <SiteHeader active="mis-solicitudes" />
      <SolicitarAltaClient />
    </div>
  );
}
