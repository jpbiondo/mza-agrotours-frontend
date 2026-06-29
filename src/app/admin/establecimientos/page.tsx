import type { Metadata } from "next";
import EstablecimientosAdminClient from "./EstablecimientosAdminClient";

export const metadata: Metadata = {
  title: "Establecimientos · Administración · Mendoza AgroTours",
  description: "Supervisá, suspendé y reactivá los establecimientos de la plataforma.",
};

export default function EstablecimientosAdminPage() {
  return <EstablecimientosAdminClient />;
}
