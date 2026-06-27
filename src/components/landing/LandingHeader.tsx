"use client";

import Image from "next/image";
import Link from "next/link";
import { LogIn, UserPlus } from "lucide-react";

const NAV_LINKS = [
  { href: "#actividades", label: "Actividades" },
  { href: "#establecimientos", label: "Establecimientos" },
  { href: "#faq", label: "Preguntas frecuentes" },
  { href: "#contacto", label: "Contacto" },
];

export default function LandingHeader() {
  return (
    <header
      style={{
        position: "sticky", top: 0, zIndex: 30,
        background: "rgba(251,249,248,.92)", backdropFilter: "blur(8px)",
        borderBottom: "1px solid var(--outline-variant)",
      }}
    >
      <div
        style={{
          maxWidth: 1160, margin: "0 auto", padding: "0 28px", height: 68,
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24,
        }}
      >
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 11, textDecoration: "none" }}>
          <Image src="/logo-mark.svg" width={36} height={36} alt="Mendoza AgroTours logo" />
          <div style={{ lineHeight: 1 }}>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18, color: "var(--green-800)" }}>Mendoza</div>
            <div style={{ fontSize: 10, letterSpacing: ".12em", textTransform: "uppercase", fontWeight: 600, color: "var(--brown-700)", marginTop: 2 }}>AgroTours</div>
          </div>
        </Link>

        <nav className="landing-nav" style={{ display: "flex", alignItems: "center", gap: 4 }}>
          {NAV_LINKS.map(({ href, label }) => (
            <a
              key={href}
              href={href}
              style={{
                padding: "8px 14px", borderRadius: "var(--radius)", fontSize: 14.5,
                fontWeight: 500, color: "var(--fg-2)", textDecoration: "none",
              }}
            >
              {label}
            </a>
          ))}
        </nav>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Link href="/acceso" className="btn btn-neutral btn-sm" style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            <LogIn size={16} /> Iniciar sesión
          </Link>
          <Link href="/registro?vista=registro" className="btn btn-primary btn-sm" style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            <UserPlus size={16} /> Registrarse
          </Link>
        </div>
      </div>

      <style>{`
        @media (max-width: 860px) { .landing-nav { display: none !important; } }
      `}</style>
    </header>
  );
}
