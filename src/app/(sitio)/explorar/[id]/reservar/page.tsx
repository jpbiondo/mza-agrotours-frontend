import type { Metadata } from "next";
import ReservaClient from "./ReservaClient";

/* La actividad sale del backend en el cliente —y este endpoint además exige
   sesión—, así que la metadata no puede nombrarla. La validez del id la
   determina `ReservaClient` en runtime. */
export const metadata: Metadata = {
  title: "Reservar · Mendoza AgroTours",
};

export default async function ReservarPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <ReservaClient id={id} />
  );
}
