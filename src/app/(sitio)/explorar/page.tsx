import type { Metadata } from "next";
import { hrefExplorar, leerFiltrosExplorar } from "@/lib/filtrosExplorar";
import CatalogClient from "./CatalogClient";

export const metadata: Metadata = {
  title: "Explorar actividades · Mendoza AgroTours",
  description: "Descubrí experiencias rurales en las fincas de Mendoza: cosechas, podas, recorridos y degustaciones.",
};

export default async function ExplorarPage({ searchParams }: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const inicial = leerFiltrosExplorar(await searchParams);
  // La key reinicia el cliente cuando se navega a `/explorar` con otros filtros
  // (p. ej. el link del header estando ya acá). Los cambios que hace el propio
  // catálogo van por `history.replaceState`, que no vuelve a renderizar esto.
  return <CatalogClient key={hrefExplorar(inicial)} inicial={inicial} />;
}
