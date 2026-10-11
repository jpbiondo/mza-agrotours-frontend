import type { Metadata } from "next";
import AyudaClient from "./AyudaClient";

export const metadata: Metadata = {
  title: "Preguntas frecuentes · Ayuda · Mendoza AgroTours",
  description:
    "Resolvé las dudas más comunes sobre reservas, cuentas y la gestión de tu finca en Mendoza AgroTours.",
};

export default function AyudaPage() {
  return <AyudaClient />;
}
