import type { Metadata } from "next";
import GuardRol from "@/components/GuardRol";
import { PermisoAdmin } from "@/lib/permisos";
import SolicitudesClient from "../SolicitudesClient";

export const metadata: Metadata = {
  title: "Solicitud de establecimiento · Administración · Mendoza AgroTours",
  description: "Revisá y validá la postulación de un nuevo establecimiento.",
};

/**
 * La misma pantalla del listado, con la solicitud ya abierta. Existe para que
 * el link de una notificación (`SOLICITUD_ESTABLECIMIENTO_POR_REVISAR`) lleve
 * directo al detalle: en el listado se abre con estado local, sin URL propia.
 */
export default async function SolicitudAdminPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <GuardRol rol="admin" permiso={PermisoAdmin.LEER_SOLICITUD_ESTABLECIMIENTO}>
      {/* El `key` remonta al pasar de una solicitud a otra por otro link: si
          no, el estado inicial quedaría con el id de la primera. */}
      <SolicitudesClient key={id} abiertaInicial={id} />
    </GuardRol>
  );
}
