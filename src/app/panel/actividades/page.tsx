import type { Metadata } from "next";
import ActividadesClient from "./ActividadesClient";

export const metadata: Metadata = {
  title: "Actividades · Panel del productor · Mendoza AgroTours",
  description: "Gestioná las experiencias de tu establecimiento: publicá, modificá y revisá su disponibilidad.",
};

export default function ActividadesPanelPage() {
  return <ActividadesClient />;
}
