"use client";

import { useEffect } from "react";
import { Loader, LayoutDashboard } from "lucide-react";
import { DESTINO_DEFAULT, type Destino } from "@/data/auth";
import type { Cuenta } from "@/types/auth";
import { Button, ResultScreen } from "@/components/ui";

const REDIRECT_MS = 2600;

interface LoginSuccessProps {
  cuenta: Cuenta;
  /** Ruta interna de la que vino el usuario (ya validada con `destinoSeguro`). */
  volver?: string | null;
}

/**
 * El destino cuando hay a dónde volver: la pantalla que pidió el login. Los
 * textos encajan en "Te estamos llevando a tu {sub}" e "Ir a {label}".
 */
const destinoVuelta = (href: string): Destino => ({
  label: "La pantalla anterior",
  sub: "Pantalla anterior",
  href,
});

export default function LoginSuccess({ cuenta, volver }: LoginSuccessProps) {
  const dest = volver ? destinoVuelta(volver) : DESTINO_DEFAULT;

  useEffect(() => {
    const t = setTimeout(() => { window.location.href = dest.href; }, REDIRECT_MS);
    return () => clearTimeout(t);
  }, [dest.href]);

  return (
    <ResultScreen
      title={`¡Hola de nuevo, ${cuenta.nombre.split(" ")[0]}!`}
      action={
        <Button size="lg" onClick={() => { window.location.href = dest.href; }}>
          <LayoutDashboard size={18} /> Ir a {dest.label.toLowerCase()}
        </Button>
      }
    >
      Iniciaste sesión correctamente. Te estamos llevando a tu{" "}
      <strong className="text-fg-1">{dest.sub.toLowerCase()}</strong>.
      <span className="mt-3 flex items-center justify-center gap-2 text-[13px] text-fg-3">
        <Loader size={16} className="spin" /> Redirigiendo…
      </span>
    </ResultScreen>
  );
}