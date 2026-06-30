import type { Metadata } from "next";
import ImpagasClient from "./ImpagasClient";

export const metadata: Metadata = {
  title: "Reservas impagas · Administración · Mendoza AgroTours",
  description: "Reembolsos que los productores deben a los visitantes.",
};

export default function ImpagasPage() {
  return <ImpagasClient />;
}
