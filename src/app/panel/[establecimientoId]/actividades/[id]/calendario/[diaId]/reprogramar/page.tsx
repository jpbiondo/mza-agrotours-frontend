import type { Metadata } from "next";
import { GuardGestionarActividad } from "@/components/panel/GuardPermisoProductor";
import ReprogramarClient from "./ReprogramarClient";

export const metadata: Metadata = {
  title: "Reprogramar día · Panel del productor · Mendoza AgroTours",
  description: "Mové un día de la actividad a otra fecha u horario.",
};

export default async function ReprogramarPage({ params }: { params: Promise<{ id: string; diaId: string }> }) {
  const { id, diaId } = await params;
  return (
    <GuardGestionarActividad>
      <ReprogramarClient actividadId={id} diaId={diaId} />
    </GuardGestionarActividad>
  );
}
