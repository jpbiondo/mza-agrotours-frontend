import type { Metadata } from "next";
import DetalleClient from "./DetalleClient";

/* El detalle sale del backend en el cliente, así que la metadata no puede
   nombrar la actividad. TODO backend: si hiciera falta para SEO, habría que
   pedir `GET /actividades/{id}` también acá en `generateMetadata`. */
export const metadata: Metadata = {
  title: "Actividad · Mendoza AgroTours",
  description: "Mirá qué incluye la experiencia, dónde es y cuánto sale antes de reservar.",
};

export default async function DetalleActividadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <DetalleClient id={id} />
  );
}
