import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
import ListClient from "./ListClient";

export const metadata: Metadata = {
  title: "Establecimientos · Mendoza AgroTours",
  description: "Conocé las fincas, bodegas y olivares de Mendoza que abren sus puertas a los visitantes.",
};

export default function EstablecimientosPage() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--cream-bg)" }}>
      <SiteHeader active="establecimientos" />
      <ListClient />
    </div>
  );
}
