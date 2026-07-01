import type { Metadata } from "next";
import CuentaClient from "./CuentaClient";

export const metadata: Metadata = {
  title: "Mi cuenta · Mendoza AgroTours",
  description: "Gestioná tus datos personales y la baja de tu cuenta.",
};

export default function CuentaPage() {
  return <CuentaClient />;
}
