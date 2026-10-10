import type { Metadata } from "next";
import EstChatsClient from "./EstChatsClient";

export const metadata: Metadata = {
  title: "Chats · Panel del productor · Mendoza AgroTours",
  description: "Consultas de los visitantes sobre las actividades de tu establecimiento.",
};

export default function PanelChatsPage() {
  return <EstChatsClient />;
}
