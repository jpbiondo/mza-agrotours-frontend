"use client";

import Image from "next/image";
import Link from "next/link";
import { LogIn, UserPlus } from "lucide-react";

interface PublicHeaderProps {
  onRegister: () => void;
  onHome: () => void;
}

const NAV_LINKS = [
  { id: "explorar", label: "Explorar experiencias" },
  { id: "fincas",   label: "Fincas" },
  { id: "cultivos", label: "Cultivos" },
  { id: "ayuda",    label: "Ayuda" },
];

export default function PublicHeader({ onRegister, onHome }: PublicHeaderProps) {
  return (
    <header
      style={{
        position: "sticky", top: 0, zIndex: 30,
        background: "rgba(251,249,248,.92)",
        backdropFilter: "blur(8px)",
        borderBottom: "1px solid var(--outline-variant)",
      }}
    >
      <div
        style={{
          maxWidth: 1160, margin: "0 auto", padding: "0 28px",
          height: 68, display: "flex", alignItems: "center",
          justifyContent: "space-between", gap: 24,
        }}
      >
        {/* Logo */}
        <div
          onClick={onHome}
          style={{ display: "flex", alignItems: "center", gap: 11, cursor: "pointer" }}
        >
          <Image src="/logo-mark.svg" width={36} height={36} alt="Mendoza AgroTours logo" />
          <div style={{ lineHeight: 1 }}>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18, color: "var(--green-800)" }}>
              Mendoza
            </div>
            <div style={{ fontSize: 10, letterSpacing: ".12em", textTransform: "uppercase", fontWeight: 600, color: "var(--brown-700)", marginTop: 2 }}>
              AgroTours
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {NAV_LINKS.map(({ id, label }) => (
            <Link
              key={id}
              href="#"
              onClick={(e) => e.preventDefault()}
              style={{
                padding: "8px 14px", borderRadius: "var(--radius)", fontSize: 14.5,
                fontWeight: 500, color: "var(--fg-2)", textDecoration: "none",
              }}
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Link
            href="/acceso"
            className="btn btn-neutral btn-sm"
            style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
          >
            <LogIn size={16} /> Iniciar sesión
          </Link>
          <button
            type="button"
            onClick={onRegister}
            className="btn btn-primary btn-sm"
            style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
          >
            <UserPlus size={16} /> Registrarse
          </button>
        </div>
      </div>
    </header>
  );
}
