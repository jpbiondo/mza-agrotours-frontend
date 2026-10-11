import type { Metadata } from "next";
import IncidenciasClient from "./IncidenciasClient";

export const metadata: Metadata = {
  title: "Incidencias · Soporte · Mendoza AgroTours",
  description:
    "Reportá errores o comportamientos inesperados del sistema y seguí el estado de cada caso con soporte.",
};

export default function IncidenciasPage() {
  return <IncidenciasClient />;
}
