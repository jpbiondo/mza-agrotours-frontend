import type { Metadata } from "next";
import ActivityForm from "@/components/panel/ActivityForm";
import GuardEstablecimientoSuspendido from "@/components/panel/GuardEstablecimientoSuspendido";
import { emptyActividadForm } from "@/data/actividad-form";

export const metadata: Metadata = {
  title: "Crear actividad · Panel del productor · Mendoza AgroTours",
};

export default function CrearActividadPage() {
  return (
    <GuardEstablecimientoSuspendido>
      <ActivityForm initial={emptyActividadForm()} />
    </GuardEstablecimientoSuspendido>
  );
}
