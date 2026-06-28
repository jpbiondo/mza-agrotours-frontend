import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
import MisReservasClient from "./MisReservasClient";

export const metadata: Metadata = {
  title: "Mis reservas · Mendoza AgroTours",
  description: "Consultá el estado de tus reservas, descargá el comprobante y revisá los detalles de cada experiencia.",
};

export default function MisReservasPage() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--cream-bg)" }}>
      <SiteHeader active="mis-reservas" />
      <MisReservasClient />
    </div>
  );
}
