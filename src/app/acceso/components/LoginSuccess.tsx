"use client";

import { useEffect } from "react";
import { Check, Loader, LayoutDashboard } from "lucide-react";
import { DESTINO_DEFAULT, type Destino } from "@/data/auth";
import type { Cuenta } from "@/types/auth";
import { Button } from "@/components/ui";

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
    <div data-screen-label="Iniciar sesión · ingresando" style={{ textAlign: "center", paddingTop: 12 }}>
      <div
        className="pop"
        style={{
          width: 84, height: 84, borderRadius: "50%", background: "var(--success-fill)",
          display: "inline-flex", alignItems: "center", justifyContent: "center", margin: "0 auto 22px",
        }}
      >
        <Check size={42} color="var(--success-fg)" />
      </div>
      <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 28, color: "var(--fg-1)", margin: 0 }}>
        ¡Hola de nuevo, {cuenta.nombre.split(" ")[0]}!
      </h1>
      <p style={{ fontSize: 15, color: "var(--fg-2)", lineHeight: 1.5, margin: "12px 0 24px" }}>
        Iniciaste sesión correctamente. Te estamos llevando a tu{" "}
        <strong style={{ color: "var(--fg-1)" }}>{dest.sub.toLowerCase()}</strong>.
      </p>
      <div style={{ display: "inline-flex", alignItems: "center", gap: 9, color: "var(--fg-3)", fontSize: 13, marginBottom: 26 }}>
        <Loader size={16} className="spin" /> Redirigiendo…
      </div>
      <div>
        <Button
          size="lg"
          onClick={() => { window.location.href = dest.href; }}
        >
          <LayoutDashboard size={18} /> Ir a {dest.label.toLowerCase()}
        </Button>
      </div>
    </div>
  );
}