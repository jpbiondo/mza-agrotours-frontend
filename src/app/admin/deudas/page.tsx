import type { Metadata } from "next";
import DeudasClient from "./DeudasClient";

export const metadata: Metadata = {
  title: "Deudas de productores · Administración · Mendoza AgroTours",
  description: "Deudas de las fincas con la plataforma por reembolsos cubiertos por el sistema.",
};

export default function DeudasPage() {
  return <DeudasClient />;
}
