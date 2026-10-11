import type { Metadata } from "next";
import RedirigirPanel from "./RedirigirPanel";

export const metadata: Metadata = {
  title: "Panel del productor · Mendoza AgroTours",
  description: "Resumen de reservas, ocupación e ingresos de tu establecimiento.",
};

export default function PanelPage() {
  return <RedirigirPanel />;
}
