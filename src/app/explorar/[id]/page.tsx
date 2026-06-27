import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import { ACTIVIDADES } from "@/data/actividades";
import { getActividadDetalle } from "@/data/actividad-detalle";
import DetalleClient from "./DetalleClient";

export function generateStaticParams() {
  return ACTIVIDADES.map((a) => ({ id: a.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const a = getActividadDetalle(id);
  if (!a) return { title: "Actividad no encontrada · Mendoza AgroTours" };
  return {
    title: `${a.titulo} · Mendoza AgroTours`,
    description: a.descripcion[0],
  };
}

export default async function DetalleActividadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const a = getActividadDetalle(id);
  if (!a) notFound();

  return (
    <div style={{ minHeight: "100vh", background: "var(--cream-bg)" }}>
      <SiteHeader active="explorar" />
      <DetalleClient a={a} />
    </div>
  );
}
