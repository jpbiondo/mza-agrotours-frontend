import type { Metadata } from "next";
import DetalleClient from "./DetalleClient";

/* El detalle sale del backend en el cliente y con el token del visitante, así
   que la metadata no puede nombrar la actividad. */
export const metadata: Metadata = {
  title: "Detalle de la reserva · Mendoza AgroTours",
  description: "Revisá los datos de tu reserva, quiénes van y cuánto pagaste, y descargá el comprobante.",
};

export default async function DetalleReservaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <DetalleClient id={id} />
  );
}
