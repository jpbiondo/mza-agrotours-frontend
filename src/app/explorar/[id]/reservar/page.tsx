import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import { ACTIVIDADES } from "@/data/actividades";
import { getActividadDetalle } from "@/data/actividad-detalle";
import ReservaClient from "./ReservaClient";

export function generateStaticParams() {
  return ACTIVIDADES.map((a) => ({ id: a.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const a = getActividadDetalle(id);
  return { title: a ? `Reservar · ${a.titulo} · Mendoza AgroTours` : "Reservar · Mendoza AgroTours" };
}

export default async function ReservarPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const a = getActividadDetalle(id);
  if (!a) notFound();

  return (
    <div style={{ minHeight: "100vh", background: "var(--cream-bg)" }}>
      <SiteHeader active="explorar" />
      <ReservaClient a={a} />
    </div>
  );
}
