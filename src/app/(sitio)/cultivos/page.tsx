import type { Metadata } from "next";
import CultivosListClient from "./CultivosListClient";

export const metadata: Metadata = {
  title: "Cultivos · Mendoza AgroTours",
  description: "Conocé los cultivos de Mendoza: su temporada de cosecha, propiedades nutricionales y recetas.",
};

export default function CultivosPage() {
  return (
    <CultivosListClient />
  );
}
