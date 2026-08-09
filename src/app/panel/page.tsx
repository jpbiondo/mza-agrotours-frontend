import type { Metadata } from "next";
import PanelClient from "./PanelClient";
import EmptyEstablecimiento from "./EmptyEstablecimiento";

export const metadata: Metadata = {
  title: "Panel del productor · Mendoza AgroTours",
  description: "Resumen de reservas, ocupación e ingresos de tu establecimiento.",
};

export default async function PanelPage({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string }>;
}) {
  // TODO backend: reemplazar por la consulta real de establecimientos del productor.
  // Por ahora el estado vacío se previsualiza con ?estado=sin-establecimiento.
  const { estado } = await searchParams;
  if (estado === "sin-establecimiento") return <EmptyEstablecimiento />;

  return <PanelClient />;
}
