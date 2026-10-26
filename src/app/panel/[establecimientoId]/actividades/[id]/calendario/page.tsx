import type { Metadata } from "next";
import { GuardGestionarActividad } from "@/components/panel/GuardPermisoProductor";
import CalendarioActividadClient from "./CalendarioActividadClient";

export const metadata: Metadata = {
  title: "Reservas de la actividad · Panel del productor · Mendoza AgroTours",
  description: "Consultá los días programados de la actividad y cómo vienen sus reservas.",
};

// Sin `generateStaticParams`, como la gestión de días: la actividad la trae el
// backend con la sesión del productor.
export default async function CalendarioActividadPage({
  params, searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ mes?: string | string[] }>;
}) {
  const { id } = await params;
  const { mes } = await searchParams;
  return (
    <GuardGestionarActividad>
      <CalendarioActividadClient actividadId={id} mesInicial={typeof mes === "string" ? mes : undefined} />
    </GuardGestionarActividad>
  );
}
