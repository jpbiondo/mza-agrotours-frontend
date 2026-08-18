import type { Metadata } from "next";
import AdminPanelClient from "./AdminPanelClient";

export const metadata: Metadata = {
  title: "Panel del sistema · Administración · Mendoza AgroTours",
  description: "Estado general de la plataforma: administradores, roles y establecimientos.",
};

export default function AdminPanelPage() {
  return <AdminPanelClient />;
}
