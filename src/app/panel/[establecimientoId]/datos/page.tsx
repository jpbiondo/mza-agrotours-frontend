import type { Metadata } from "next";
import DatosClient from "./DatosClient";

export const metadata: Metadata = {
  title: "Datos del establecimiento · Panel del productor · Mendoza AgroTours",
  description: "Consultá y actualizá la información, el contacto y los cultivos de tu establecimiento.",
};

export default function DatosPage() {
  return <DatosClient />;
}
