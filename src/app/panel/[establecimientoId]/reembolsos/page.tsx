import type { Metadata } from "next";
import GuardPermisoProductor from "@/components/panel/GuardPermisoProductor";
import { PermisoProductor } from "@/lib/permisos";
import ReembolsosClient from "./ReembolsosClient";

export const metadata: Metadata = {
  title: "Reembolsos pendientes · Panel del productor · Mendoza AgroTours",
  description: "Reintentá las devoluciones que Mercado Pago no pudo hacer al cancelarse una reserva.",
};

const SIN_PERMISO =
  "Tu rol en este establecimiento no incluye gestionar reembolsos. Pedíselo al Productor Líder de la finca.";

export default function ReembolsosPage() {
  return (
    <GuardPermisoProductor permiso={PermisoProductor.GESTIONAR_REEMBOLSOS_PENDIENTES} motivo={SIN_PERMISO}>
      <ReembolsosClient />
    </GuardPermisoProductor>
  );
}
