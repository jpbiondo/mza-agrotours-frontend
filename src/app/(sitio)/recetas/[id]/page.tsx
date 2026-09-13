import type { Metadata } from "next";
import DetalleClient from "./DetalleClient";

/* La receta sale del backend en el cliente, así que la metadata no puede
   nombrarla. TODO backend: si hiciera falta para SEO, habría que pedir el
   detalle también acá en `generateMetadata`. */
export const metadata: Metadata = {
  title: "Receta · Mendoza AgroTours",
  description: "Ingredientes, pasos y cultivos de una receta del recetario de Mendoza AgroTours.",
};

export default async function RecetaDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return <DetalleClient id={id} />;
}
