import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { retornoDeStatus } from "@/lib/mercadoPago";

export const metadata: Metadata = {
  title: "Pago con Mercado Pago · Mendoza AgroTours",
  robots: { index: false },
};

/** Un query param puede venir repetido: se toma el primero. */
const primero = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

/**
 * Adonde vuelve el Checkout Pro (`back_urls` de la preferencia). El backend usa
 * la misma URL para éxito, pendiente y error, y Mercado Pago le agrega a la
 * query el `status` del pago y la `external_reference`, que es el id de la
 * reserva. No se muestra nada: se pasa al detalle, que es donde el visitante va
 * a buscar su reserva después, y el aviso de ahí se basa en el estado real.
 *
 * TODO backend: `MP_BACK_URL` tiene que apuntar a `{front}/mercadopago/pago`.
 */
export default async function RetornoPagoPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const q = await searchParams;
  const reserva = primero(q.external_reference);
  // Sin reserva no hay detalle al que ir; la lista la va a mostrar igual.
  if (!reserva) redirect("/mis-reservas");
  // `collection_status` es el nombre viejo del mismo dato.
  const retorno = retornoDeStatus(primero(q.status) ?? primero(q.collection_status));
  redirect(`/mis-reservas/${encodeURIComponent(reserva)}?pago=${retorno}`);
}
