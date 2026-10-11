import type { Metadata } from "next";
import ReservaClient from "./ReservaClient";

/* La actividad sale del backend en el cliente —y este endpoint además exige
   sesión—, así que la metadata no puede nombrarla. La validez del id la
   determina `ReservaClient` en runtime. */
export const metadata: Metadata = {
  title: "Reservar · Mendoza AgroTours",
};

type Query = Record<string, string | string[] | undefined>;

/** Un parámetro repetido en la query llega como array: vale el primero. */
function primero(v: string | string[] | undefined): string {
  return (Array.isArray(v) ? v[0] : v) ?? "";
}

export default async function ReservarPage({ params, searchParams }: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Query>;
}) {
  const { id } = await params;
  const query = await searchParams;

  // `dia` y `visitantes` los manda el widget de reserva del detalle.
  return (
    <ReservaClient
      id={id}
      diaInicial={primero(query.dia)}
      visitantesIniciales={Number(primero(query.visitantes)) || 1}
    />
  );
}
