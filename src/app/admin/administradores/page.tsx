import type { Metadata } from "next";
import AdministradoresClient from "./AdministradoresClient";

export const metadata: Metadata = {
  title: "Administradores · Administración · Mendoza AgroTours",
  description: "Gestioná el equipo de administración del sistema y asigná roles.",
};

export default function AdministradoresPage() {
  return <AdministradoresClient />;
}
