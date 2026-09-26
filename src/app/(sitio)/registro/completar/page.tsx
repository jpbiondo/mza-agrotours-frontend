import type { Metadata } from "next";
import CompletarRegistroClient from "./CompletarRegistroClient";

export const metadata: Metadata = {
  title: "Completá tu registro · Mendoza AgroTours",
  description: "Cargá tus datos para terminar de crear tu cuenta.",
};

export default function CompletarRegistroPage() {
  return <CompletarRegistroClient />;
}
