import type { Metadata } from "next";
import { GuardGestionarActividad } from "@/components/panel/GuardPermisoProductor";
import CalendarioClient from "./CalendarioClient";

export const metadata: Metadata = {
  title: "Calendario de la actividad · Panel del productor · Mendoza AgroTours",
  description: "Abrí días de reserva, sueltos o en lote, y ajustá el cupo de cada día.",
};

// Sin `generateStaticParams`: la actividad la trae el backend con la sesión del
// productor, así que no hay lista de ids conocida en build. Tampoco va detrás de
// `GuardEstablecimientoSuspendido`: suspendido, el calendario se puede consultar
// y la pantalla bloquea sólo las escrituras.
export default async function CalendarioActividadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <GuardGestionarActividad>
      <CalendarioClient actividadId={id} />
    </GuardGestionarActividad>
  );
}
