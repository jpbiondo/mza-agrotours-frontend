"use client";
import Image from "next/image";
import { useState } from "react";
import {
  LifeBuoy,
  Sprout,
  Lock,
} from "lucide-react";
import { TextField, EyeToggle } from "@/components/ui/text-field";
import fotoPanel from "../../../../public/acceso/panel.jpg";

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
          <Image src="/logo-pano.svg" width={45} height={30} alt="Mendoza AgroTours logo" />
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
    <div className="mx-auto grid min-h-[calc(100vh_-_69px)] max-w-[1240px] grid-cols-1 min-[881px]:grid-cols-2">
      {/* Panel visual de marca: sólo en escritorio. El verde de fondo es lo
          que se ve mientras carga la foto. */}
      <aside className="relative my-7 ml-7 hidden min-h-[520px] overflow-hidden rounded-lg bg-green-900 min-[881px]:block">
        {/* Decorativa: el mensaje lo da la frase. Sin `priority` a propósito:
            en celular el panel está oculto y la foto no tiene por qué bajarse;
            en escritorio el lazy la pide igual de entrada porque está a la vista. */}
        <Image
          src={fotoPanel}
          alt=""
          fill
          placeholder="blur"
          sizes="(min-width: 1240px) 600px, 50vw"
          className="object-cover object-[58%_center]"
        />
        {/* La foto es clara y cargada: velo suave arriba para la etiqueta y
            fuerte abajo, donde va la frase en blanco. */}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(14,46,12,.35)_0%,rgba(14,46,12,.1)_35%,rgba(14,46,12,.85)_100%)]" />
        <div className="absolute inset-0 flex flex-col p-10">
          <div className="inline-flex items-center gap-2 self-start rounded-pill bg-white/16 px-3.5 py-[7px] text-[12.5px] font-semibold text-white backdrop-blur-[4px]">
            <Sprout size={15} /> {eyebrow || "Turismo rural en Mendoza"}
          </div>
          <div className="mt-auto">
            <blockquote className="m-0 font-display text-[26px] leading-[1.3] font-semibold tracking-[-.01em] text-white">
              {quote || "Viví la cosecha junto a los productores mendocinos."}
            </blockquote>
            {quoteAuthor && <div className="mt-4 text-[13.5px] font-medium text-white/85">{quoteAuthor}</div>}
          </div>
        </div>
      </aside>

      {/* Columna del formulario */}
      <main className="flex items-start justify-center px-7 pt-12 pb-16">
        <div className="w-full max-w-[412px]">{children}</div>
      </main>
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