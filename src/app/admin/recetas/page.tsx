import type { Metadata } from "next";
import RecetasClient from "./RecetasClient";

export const metadata: Metadata = {
  title: "Recetas · Administración · Mendoza AgroTours",
  description: "Administrá el recetario de la plataforma, asociado a los cultivos.",
};

export default function RecetasPage() {
  return <RecetasClient />;
}
