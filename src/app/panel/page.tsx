import type { Metadata } from "next";
import PanelClient from "./PanelClient";

export const metadata: Metadata = {
  title: "Panel del productor · Mendoza AgroTours",
  description: "Resumen de reservas, ocupación e ingresos de tu establecimiento.",
};

export default function PanelPage() {
  return <PanelClient />;
}
