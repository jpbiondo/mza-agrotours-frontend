import type { Metadata } from "next";
import CatalogClient from "./CatalogClient";

export const metadata: Metadata = {
  title: "Explorar actividades · Mendoza AgroTours",
  description: "Descubrí experiencias rurales en las fincas de Mendoza: cosechas, podas, recorridos y degustaciones.",
};

export default function ExplorarPage() {
  return (
    <CatalogClient />
  );
}
