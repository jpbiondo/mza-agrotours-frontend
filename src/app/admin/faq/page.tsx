import type { Metadata } from "next";
import FaqAdminClient from "./FaqAdminClient";

export const metadata: Metadata = {
  title: "Preguntas frecuentes · Administración · Mendoza AgroTours",
  description: "Mantené la base de conocimiento que consultan los usuarios.",
};

export default function FaqAdminPage() {
  return <FaqAdminClient />;
}
