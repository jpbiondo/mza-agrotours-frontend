import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ACTIVIDADES_PROD, getActividad } from "@/data/actividades-prod";
import CalendarioClient from "./CalendarioClient";

export function generateStaticParams() {
  return ACTIVIDADES_PROD.map((a) => ({ id: a.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const act = getActividad(id);
  return { title: act ? `Calendario · ${act.nombre} · Mendoza AgroTours` : "Calendario · Mendoza AgroTours" };
}

export default async function CalendarioActividadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const act = getActividad(id);
  if (!act) notFound();
  const { id: actId, nombre, estado, cultivos } = act;
  return <CalendarioClient act={{ id: actId, nombre, estado, cultivos }} />;
}
