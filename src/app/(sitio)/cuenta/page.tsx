import type { Metadata } from "next";
import CuentaClient from "./CuentaClient";

export const metadata: Metadata = {
  title: "Mi cuenta · Mendoza AgroTours",
  description: "Gestioná tus datos personales y la baja de tu cuenta.",
};

export default async function CuentaPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab } = await searchParams;
  return <CuentaClient initialTab={tab === "seguridad" ? "seguridad" : "datos"} />;
}
