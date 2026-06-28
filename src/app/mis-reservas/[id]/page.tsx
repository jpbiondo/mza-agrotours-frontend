import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import { RESERVAS, getReserva } from "@/data/reservas";
import DetalleClient from "./DetalleClient";

export function generateStaticParams() {
  return RESERVAS.map((r) => ({ id: r.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const r = getReserva(id);
  return { title: r ? `Reserva ${r.id} · ${r.titulo} · Mendoza AgroTours` : "Reserva · Mendoza AgroTours" };
}

export default async function DetalleReservaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const reserva = getReserva(id);
  if (!reserva) notFound();

  return (
    <div style={{ minHeight: "100vh", background: "var(--cream-bg)" }}>
      <SiteHeader active="mis-reservas" />
      <DetalleClient reserva={reserva} />
    </div>
  );
}
