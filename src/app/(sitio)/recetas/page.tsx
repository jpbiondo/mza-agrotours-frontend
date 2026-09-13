import type { Metadata } from "next";
import RecetasListClient from "./RecetasListClient";

export const metadata: Metadata = {
  title: "Recetas · Mendoza AgroTours",
  description:
    "Recetas tradicionales y conservas caseras para cocinar con lo que se cosecha en las fincas de Mendoza.",
};

export default function RecetasPage() {
  return <RecetasListClient />;
}
