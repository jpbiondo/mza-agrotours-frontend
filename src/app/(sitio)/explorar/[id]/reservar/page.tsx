import type { Metadata } from "next";
import { ACTIVIDADES } from "@/data/actividades";
import { getActividadDetalle } from "@/data/actividad-detalle";
import ReservaClient from "./ReservaClient";

export function generateStaticParams() {
  return ACTIVIDADES.map((a) => ({ id: a.id }));
}

/**
 * `getActividadDetalle` sólo conoce el catálogo mock: cuando no encuentra el id
 * (porque es una actividad real del backend) cae al título genérico, no a 404.
 * La validez del id la determina `ReservaClient` contra el backend en runtime.
 */
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const a = getActividadDetalle(id);
  return { title: a ? `Reservar · ${a.titulo} · Mendoza AgroTours` : "Reservar · Mendoza AgroTours" };
}

export default async function ReservarPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <ReservaClient id={id} />
  );
}
