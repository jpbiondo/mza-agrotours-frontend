import type { Metadata } from "next";
import GuardSesion from "@/components/GuardSesion";
import MisSolicitudesClient from "./MisSolicitudesClient";

export const metadata: Metadata = {
  title: "Mis solicitudes · Mendoza AgroTours",
  description:
    "Seguí el estado de las solicitudes de alta de establecimiento que enviaste.",
};

export default function MisSolicitudesPage() {
  return (
    <GuardSesion>
      <MisSolicitudesClient />
    </GuardSesion>
  );
}
