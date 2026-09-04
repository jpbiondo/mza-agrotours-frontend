import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ActivityForm from "@/components/panel/ActivityForm";
import { ACTIVIDADES_PROD } from "@/data/actividades-prod";
import { hydrateActividadForm } from "@/data/actividad-form";

export function generateStaticParams() {
  return ACTIVIDADES_PROD.map((a) => ({ id: a.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const form = hydrateActividadForm(id);
  return { title: form ? `Modificar ${form.nombre} · Mendoza AgroTours` : "Modificar actividad · Mendoza AgroTours" };
}

export default async function EditarActividadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const form = hydrateActividadForm(id);
  if (!form) notFound();
  return <ActivityForm mode="editar" initial={form} />;
}
