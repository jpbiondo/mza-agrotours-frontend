import type { Metadata } from "next";
import RangosClient from "./RangosClient";

export const metadata: Metadata = {
  title: "Gestión del rango etario · Administración · Mendoza AgroTours",
  description: "Definí los rangos de edad para precios diferenciados por edad del visitante.",
};

export default function RangosPage() {
  return <RangosClient />;
}
