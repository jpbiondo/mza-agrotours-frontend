import type { Metadata } from "next";
import ActivityForm from "@/components/panel/ActivityForm";
import { GuardGestionarActividad } from "@/components/panel/GuardPermisoProductor";
import GuardEstablecimientoSuspendido from "@/components/panel/GuardEstablecimientoSuspendido";
import { emptyActividadForm } from "@/data/actividad-form";

export const metadata: Metadata = {
  title: "Crear actividad · Panel del productor · Mendoza AgroTours",
};

export default function CrearActividadPage() {
  return (
    <GuardGestionarActividad>
      <GuardEstablecimientoSuspendido>
        <ActivityForm initial={emptyActividadForm()} />
      </GuardEstablecimientoSuspendido>
    </GuardGestionarActividad>
  );
}
