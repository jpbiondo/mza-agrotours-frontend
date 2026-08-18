import type { Metadata } from "next";
import GuardRol from "@/components/GuardRol";
import SolicitudesClient from "./SolicitudesClient";

export const metadata: Metadata = {
  title: "Solicitudes de establecimientos · Administración · Mendoza AgroTours",
  description: "Revisá y validá las postulaciones de nuevos establecimientos.",
};

export default function SolicitudesPage() {
  // El layout de /admin ya exige el rol; acá se suma el permiso de lectura.
  return (
    <GuardRol rol="admin" permiso="LEER_SOLICITUD_ESTABLECIMIENTO">
      <SolicitudesClient />
    </GuardRol>
  );
}
