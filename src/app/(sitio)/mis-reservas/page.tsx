import type { Metadata } from "next";
import MisReservasClient from "./MisReservasClient";

export const metadata: Metadata = {
  title: "Mis reservas · Mendoza AgroTours",
  description: "Consultá el estado de tus reservas, descargá el comprobante y revisá los detalles de cada experiencia.",
};

export default function MisReservasPage() {
  return (
    <MisReservasClient />
  );
}
