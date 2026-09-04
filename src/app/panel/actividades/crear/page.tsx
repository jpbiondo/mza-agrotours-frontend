import type { Metadata } from "next";
import ActivityForm from "@/components/panel/ActivityForm";
import { emptyActividadForm } from "@/data/actividad-form";

export const metadata: Metadata = {
  title: "Crear actividad · Panel del productor · Mendoza AgroTours",
};

export default function CrearActividadPage() {
  return <ActivityForm mode="crear" initial={emptyActividadForm()} />;
}
