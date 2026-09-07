import type { Metadata } from "next";
import ActivityForm from "@/components/panel/ActivityForm";
import GuardSuspension from "@/components/panel/GuardSuspension";
import { emptyActividadForm } from "@/data/actividad-form";

export const metadata: Metadata = {
  title: "Crear actividad · Panel del productor · Mendoza AgroTours",
};

export default function CrearActividadPage() {
  return (
    <GuardSuspension>
      <ActivityForm initial={emptyActividadForm()} />
    </GuardSuspension>
  );
}
