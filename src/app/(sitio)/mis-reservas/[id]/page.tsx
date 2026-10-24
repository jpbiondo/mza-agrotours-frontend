import type { Metadata } from "next";
import { leerRetornoPago } from "@/lib/mercadoPago";
import GuardSesion from "@/components/GuardSesion";
import DetalleClient from "./DetalleClient";

/* El detalle sale del backend en el cliente y con el token del visitante, así
   que la metadata no puede nombrar la actividad. */
export const metadata: Metadata = {
  title: "Detalle de la reserva · Mendoza AgroTours",
  description: "Revisá los datos de tu reserva, quiénes van y cuánto pagaste, y descargá el comprobante.",
};

export default async function DetalleReservaPage({ params, searchParams }: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  // `?pago=` lo pone /mercadopago/pago al volver del checkout.
  const { pago } = await searchParams;

  return (
    <GuardSesion>
      <DetalleClient id={id} retornoPago={leerRetornoPago(Array.isArray(pago) ? pago[0] : pago)} />
    </GuardSesion>
  );
}
