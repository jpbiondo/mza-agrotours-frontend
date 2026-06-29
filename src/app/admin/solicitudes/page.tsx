import type { Metadata } from "next";
import SolicitudesClient from "./SolicitudesClient";

export const metadata: Metadata = {
  title: "Solicitudes de establecimientos · Administración · Mendoza AgroTours",
  description: "Revisá y validá las postulaciones de nuevos establecimientos.",
};

export default function SolicitudesPage() {
  return <SolicitudesClient />;
}
