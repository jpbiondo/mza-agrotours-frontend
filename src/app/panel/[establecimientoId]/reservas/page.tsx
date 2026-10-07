import type { Metadata } from "next";
import ReservasRecibidasClient from "./ReservasRecibidasClient";

export const metadata: Metadata = {
  title: "Reservas recibidas · Panel del productor · Mendoza AgroTours",
  description: "Gestioná las reservas de las experiencias de tu establecimiento.",
};

export default function ReservasRecibidasPage() {
  return <ReservasRecibidasClient />;
}
