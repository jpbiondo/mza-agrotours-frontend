import type { Metadata } from "next";
import DetalleClient from "./DetalleClient";

/* El detalle sale del backend en el cliente, así que la metadata no puede
   nombrar al establecimiento. TODO backend: si hiciera falta para SEO, habría
   que pedir el detalle también acá en `generateMetadata`. */
export const metadata: Metadata = {
  title: "Establecimiento · Mendoza AgroTours",
  description: "Conocé el establecimiento, sus cultivos y las actividades que ofrece.",
};

export default async function DetalleEstablecimientoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <DetalleClient id={id} />
  );
}
