import type { Metadata } from "next";
import ListClient from "./ListClient";

export const metadata: Metadata = {
  title: "Establecimientos · Mendoza AgroTours",
  description: "Conocé las fincas, bodegas y olivares de Mendoza que abren sus puertas a los visitantes.",
};

export default function EstablecimientosPage() {
  return (
    <ListClient />
  );
}
