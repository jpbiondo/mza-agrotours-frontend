import type { Metadata } from "next";
import { GuardGestionarActividad } from "@/components/panel/GuardPermisoProductor";
import ReservasDiaClient from "./ReservasDiaClient";

export const metadata: Metadata = {
  title: "Reservas del día · Panel del productor · Mendoza AgroTours",
  description: "Las reservas de un día de la actividad, con sus visitantes y estado de pago.",
};

// Sin `generateStaticParams`, como el calendario del que sale.
export default async function ReservasDiaPage({ params }: { params: Promise<{ id: string; diaId: string }> }) {
  const { id, diaId } = await params;
  return (
    <GuardGestionarActividad>
      <ReservasDiaClient actividadId={id} diaId={diaId} />
    </GuardGestionarActividad>
  );
}
