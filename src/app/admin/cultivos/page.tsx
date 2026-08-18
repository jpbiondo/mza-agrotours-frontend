import type { Metadata } from "next";
import CultivosClient from "./CultivosClient";

export const metadata: Metadata = {
  title: "Cultivos · Administración · Mendoza AgroTours",
  description: "Administrá el catálogo de cultivos de la plataforma.",
};

export default function CultivosPage() {
  return <CultivosClient />;
}
