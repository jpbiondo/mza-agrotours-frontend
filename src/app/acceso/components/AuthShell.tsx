"use client";

import Image from "next/image";
import { useState } from "react";
import {
  LifeBuoy,
  Sprout,
  AlertCircle,
  AlertTriangle,
  Info,
  Lock,
  ArrowLeft,
} from "lucide-react";
import { TextField, EyeToggle } from "@/components/ui/text-field";

/* ---- Header público minimal (logo + ayuda) ----------------------------- */
export function AuthHeader({ onHome }: { onHome?: () => void }) {
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
          maxWidth: 1240, margin: "0 auto", padding: "0 28px", height: 68,
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24,
        }}
      >
        <div onClick={onHome} style={{ display: "flex", alignItems: "center", gap: 11, cursor: "pointer" }}>
          <Image src="/logo-mark.svg" width={36} height={36} alt="Mendoza AgroTours logo" />
          <div style={{ lineHeight: 1 }}>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18, color: "var(--green-800)" }}>Mendoza</div>
            <div style={{ fontSize: 10, letterSpacing: ".12em", textTransform: "uppercase", fontWeight: 600, color: "var(--brown-700)", marginTop: 2 }}>AgroTours</div>
          </div>
        </div>
        <a
          href="#"
          onClick={(e) => e.preventDefault()}
          style={{
            display: "inline-flex", alignItems: "center", gap: 7, fontSize: 14,
            fontWeight: 500, color: "var(--fg-2)", textDecoration: "none",
          }}
        >
          <LifeBuoy size={16} /> ¿Necesitás ayuda?
        </a>
      </div>
    </header>
  );
}

/* ---- AuthLayout — split: panel de marca + tarjeta de formulario --------- */
interface AuthLayoutProps {
  children: React.ReactNode;
  eyebrow?: string;
  quote?: string;
  quoteAuthor?: string;
}

export function AuthLayout({ children, eyebrow, quote, quoteAuthor }: AuthLayoutProps) {
  return (
    <div
      style={{
        minHeight: "calc(100vh - 69px)", display: "grid",
        gridTemplateColumns: "1fr 1fr", maxWidth: 1240, margin: "0 auto",
      }}
      className="auth-grid"
    >
      {/* Panel visual de marca (se oculta en pantallas chicas vía CSS) */}
      <aside
        className="auth-brand"
        style={{
          position: "relative", overflow: "hidden", minHeight: 520,
          margin: "28px 0 28px 28px", borderRadius: "var(--radius-lg)",
          background: "linear-gradient(135deg, #0a2209 0%, #154212 30%, #1e5418 55%, #2d5a27 78%, #4a7c3f 100%)",
        }}
      >
        <div
          style={{
            position: "absolute", inset: 0,
            background:
              "radial-gradient(ellipse 60% 50% at 80% 30%, rgba(167,201,139,.18) 0%, transparent 70%), radial-gradient(ellipse 50% 60% at 15% 85%, rgba(200,127,42,.12) 0%, transparent 60%)",
          }}
        />
        <div
          style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(160deg, rgba(14,46,12,.30) 0%, rgba(14,46,12,.15) 45%, rgba(14,46,12,.62) 100%)",
          }}
        />
        <div style={{ position: "absolute", inset: 0, padding: 40, display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "inline-flex", alignItems: "center", gap: 8, padding: "7px 14px",
              borderRadius: 999, background: "rgba(255,255,255,.16)", color: "#fff",
              fontSize: 12.5, fontWeight: 600, backdropFilter: "blur(4px)", alignSelf: "flex-start",
            }}
          >
            <Sprout size={15} /> {eyebrow || "Turismo rural en Mendoza"}
          </div>
          <div style={{ marginTop: "auto" }}>
            <blockquote
              style={{
                margin: 0, fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 26,
                lineHeight: 1.3, color: "#fff", letterSpacing: "-.01em",
              }}
            >
              {quote || "Viví la cosecha junto a los productores mendocinos."}
            </blockquote>
            {quoteAuthor && (
              <div style={{ marginTop: 16, fontSize: 13.5, color: "rgba(255,255,255,.85)", fontWeight: 500 }}>{quoteAuthor}</div>
            )}
          </div>
        </div>
      </aside>

      {/* Columna del formulario */}
      <main style={{ display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "48px 28px 64px" }}>
        <div style={{ width: "100%", maxWidth: 412 }}>{children}</div>
      </main>

      {/* Oculta el panel de marca en pantallas chicas */}
      <style>{`
        @media (max-width: 880px) {
          .auth-grid  { grid-template-columns: 1fr !important; }
          .auth-brand { display: none !important; }
        }
      `}</style>
    </div>
  );
}

/* ---- Password input con ojo (mostrar/ocultar) -------------------------- */
interface PasswordInputProps {
  id?: string;
  value: string;
  onChange: (val: string) => void;
  error?: string | false | null;
  placeholder?: string;
  autoComplete?: string;
}

export function PasswordInput({ id, value, onChange, error, placeholder, autoComplete }: PasswordInputProps) {
  const [shown, setShown] = useState(false);
  return (
    <TextField
      id={id}
      icon={<Lock />}
      type={shown ? "text" : "password"}
      value={value}
      placeholder={placeholder}
      autoComplete={autoComplete}
      onChange={onChange}
      aria-invalid={!!error}
      rightSlot={<EyeToggle shown={shown} onToggle={() => setShown((s) => !s)} />}
    />
  );
}

/* ---- Encabezado de formulario (icono + título + bajada) ---------------- */
export function FormHead({ icon, title, sub }: { icon?: React.ReactNode; title: string; sub?: string }) {
  return (
    <div style={{ marginBottom: 26 }}>
      {icon && (
        <div
          style={{
            width: 48, height: 48, borderRadius: 12, background: "var(--green-050)",
            display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 18,
          }}
        >
          {icon}
        </div>
      )}
      <h1
        style={{
          fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 30, color: "var(--fg-1)",
          margin: 0, letterSpacing: "-.01em", lineHeight: 1.15,
        }}
      >
        {title}
      </h1>
      {sub && <p style={{ fontSize: 15, color: "var(--fg-2)", lineHeight: 1.5, margin: "12px 0 0" }}>{sub}</p>}
    </div>
  );
}

/* ---- Banner de error a nivel formulario -------------------------------- */
type AlertTone = "danger" | "warning" | "info";

export function FormAlert({ tone = "danger", icon, children }: { tone?: AlertTone; icon?: React.ReactNode; children: React.ReactNode }) {
  const map = {
    danger: { bg: "var(--danger-fill)", fg: "var(--danger-fg)", bd: "var(--danger)", ic: <AlertCircle size={18} /> },
    warning: { bg: "var(--warning-fill)", fg: "var(--warning-fg)", bd: "var(--warning)", ic: <AlertTriangle size={18} /> },
    info: { bg: "var(--info-fill)", fg: "var(--info-fg)", bd: "var(--info)", ic: <Info size={18} /> },
  }[tone];
  return (
    <div
      className="pop"
      style={{
        display: "flex", alignItems: "flex-start", gap: 11, padding: "13px 15px",
        borderRadius: "var(--radius)", background: map.bg,
        border: "1px solid " + map.bd, marginBottom: 22,
      }}
    >
      <span style={{ color: map.fg, display: "inline-flex", marginTop: 1, flexShrink: 0 }}>{icon || map.ic}</span>
      <div style={{ fontSize: 13.5, color: map.fg, lineHeight: 1.45, fontWeight: 500 }}>{children}</div>
    </div>
  );
}

/* ---- Link inline de auth ----------------------------------------------- */
export function AuthLink({ onClick, href, children, strong }: { onClick?: () => void; href?: string; children: React.ReactNode; strong?: boolean }) {
  return (
    <a
      href={href || "#"}
      onClick={(e) => { if (!href) e.preventDefault(); onClick?.(); }}
      style={{ color: "var(--green-800)", fontWeight: strong ? 700 : 600, textDecoration: "none" }}
      onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
      onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
    >
      {children}
    </a>
  );
}

/* ---- Botón "volver" ---------------------------------------------------- */
export function BackLink({ onClick, children = "Volver" }: { onClick?: () => void; children?: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "inline-flex", alignItems: "center", gap: 7, background: "transparent",
        border: "none", cursor: "pointer", color: "var(--fg-2)", fontSize: 14,
        fontWeight: 500, marginBottom: 22, padding: 0,
      }}
      onMouseEnter={(e) => (e.currentTarget.style.color = "var(--green-800)")}
      onMouseLeave={(e) => (e.currentTarget.style.color = "var(--fg-2)")}
    >
      <ArrowLeft size={17} /> {children}
    </button>
  );
}