import type { Metadata } from "next";
import IncidenciasClient from "./IncidenciasClient";

export const metadata: Metadata = {
  title: "Gestionar incidencias · Administración · Mendoza AgroTours",
  description: "Seguí y actualizá el estado de las incidencias reportadas por los usuarios.",
};

export default function IncidenciasPage() {
  return <IncidenciasClient />;
}
