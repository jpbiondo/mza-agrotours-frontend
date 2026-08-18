import type { Metadata } from "next";
import ParametrosClient from "./ParametrosClient";

export const metadata: Metadata = {
  title: "Parámetros del sistema · Administración · Mendoza AgroTours",
  description: "Consultá y modificá los parámetros del negocio y las reglas de operación.",
};

export default function ParametrosPage() {
  return <ParametrosClient />;
}
