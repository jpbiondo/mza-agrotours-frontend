import type { Metadata } from "next";
import { GuardGestionarActividad } from "@/components/panel/GuardPermisoProductor";
import CalendarioActividadClient from "./CalendarioActividadClient";

export const metadata: Metadata = {
  title: "Reservas de la actividad · Panel del productor · Mendoza AgroTours",
  description: "Consultá los días programados de la actividad y cómo vienen sus reservas.",
};

// Sin `generateStaticParams` ni `GuardEstablecimientoSuspendido`, como la
// gestión de días: es de consulta, así que suspendido también se puede ver.
export default async function CalendarioActividadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <GuardGestionarActividad>
      <CalendarioActividadClient actividadId={id} />
    </GuardGestionarActividad>
  );
}
