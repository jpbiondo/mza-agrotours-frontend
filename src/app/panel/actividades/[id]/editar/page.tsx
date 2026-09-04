import type { Metadata } from "next";
import EditarActividadClient from "./EditarActividadClient";

export const metadata: Metadata = {
  title: "Modificar actividad · Panel del productor · Mendoza AgroTours",
};

// Sin `generateStaticParams`: la actividad la trae el backend con la sesión del
// productor, así que no hay lista de ids conocida en build.
export default async function EditarActividadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <EditarActividadClient actividadId={id} />;
}
