import type { Metadata } from "next";
import CultivosListClient from "./CultivosListClient";

export const metadata: Metadata = {
  title: "Cultivos · Mendoza AgroTours",
  description: "Conocé los cultivos de Mendoza: su estacionalidad, sus propiedades y las actividades en las que se cosechan.",
};

export default function CultivosPage() {
  return (
    <CultivosListClient />
  );
}
