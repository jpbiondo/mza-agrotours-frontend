import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ESTABLECIMIENTOS, getEstablecimiento } from "@/data/establecimientos";
import DetalleClient from "./DetalleClient";

export function generateStaticParams() {
  return ESTABLECIMIENTOS.map((e) => ({ id: e.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const e = getEstablecimiento(id);
  if (!e) return { title: "Establecimiento no encontrado · Mendoza AgroTours" };
  return { title: `${e.nombre} · Mendoza AgroTours`, description: e.descripcion };
}

export default async function DetalleEstablecimientoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const est = getEstablecimiento(id);
  if (!est) notFound();

  return (
    <DetalleClient est={est} />
  );
}
