import type { Metadata } from "next";
import EstadisticasClient from "./EstadisticasClient";

export const metadata: Metadata = {
  title: "Estadísticas y reportes · Panel del productor · Mendoza AgroTours",
  description: "Ocupación, beneficios, cancelaciones y performance por actividad de tu establecimiento.",
};

export default function EstadisticasPage() {
  return <EstadisticasClient />;
}
