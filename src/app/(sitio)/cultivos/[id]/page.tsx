import type { Metadata } from "next";
import DetalleClient from "./DetalleClient";

/* El detalle sale del backend en el cliente, así que la metadata no puede
   nombrar al cultivo. TODO backend: si hiciera falta para SEO, habría que pedir
   el detalle también acá en `generateMetadata`. */
export const metadata: Metadata = {
  title: "Cultivo · Mendoza AgroTours",
  description: "Conocé el cultivo: su estacionalidad, sus propiedades y las actividades en las que se cosecha.",
};

export default async function CultivoDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <DetalleClient id={id} />
  );
}
