import type { Metadata } from "next";
import InvitacionClient from "./InvitacionClient";

export const metadata: Metadata = {
  title: "Invitación a gestionar · Mendoza AgroTours",
  description: "Aceptá o rechazá la invitación para sumarte a gestionar un establecimiento.",
};

export default async function InvitacionPage({ searchParams }: { searchParams: Promise<{ inv?: string }> }) {
  const sp = await searchParams;
  return <InvitacionClient invId={typeof sp.inv === "string" ? sp.inv : undefined} />;
}
