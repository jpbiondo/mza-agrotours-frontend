import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
import MisSolicitudesClient from "./MisSolicitudesClient";

export const metadata: Metadata = {
  title: "Mis solicitudes · Mendoza AgroTours",
  description:
    "Seguí el estado de las solicitudes de alta de establecimiento que enviaste.",
};

export default function MisSolicitudesPage() {
  return (
    <div className="min-h-screen bg-cream-bg">
      <SiteHeader active="mis-solicitudes" />
      <MisSolicitudesClient />
    </div>
  );
}
