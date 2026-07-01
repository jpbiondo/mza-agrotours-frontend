import Image from "next/image";
import Link from "next/link";
import { LogIn, UserPlus, UserCog } from "lucide-react";

const NAV_LINKS = [
  { id: "explorar", href: "/explorar", label: "Actividades" },
  { id: "establecimientos", href: "/establecimientos", label: "Establecimientos" },
  { id: "cultivos", href: "/cultivos", label: "Cultivos" },
  { id: "mis-reservas", href: "/mis-reservas", label: "Mis reservas" },
  { id: "faq", href: "/#faq", label: "Preguntas frecuentes" },
];

interface SiteHeaderProps {
  active?: "explorar" | "establecimientos" | "cultivos" | "mis-reservas" | "faq";
}

export default function SiteHeader({ active }: SiteHeaderProps) {
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
          maxWidth: 1200, margin: "0 auto", padding: "0 28px", height: 68,
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

        <nav className="site-nav" style={{ display: "flex", alignItems: "center", gap: 4 }}>
          {NAV_LINKS.map(({ id, href, label }) => {
            const on = id === active;
            return (
              <Link
                key={id}
                href={href}
                style={{
                  padding: "8px 14px", borderRadius: "var(--radius)", fontSize: 14.5,
                  fontWeight: on ? 600 : 500, textDecoration: "none",
                  color: on ? "var(--green-800)" : "var(--fg-2)",
                  background: on ? "var(--green-050)" : "transparent",
                }}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Link href="/cuenta" aria-label="Mi cuenta" title="Mi cuenta" className="btn btn-neutral btn-sm" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "0 10px", height: 36 }}>
            <UserCog size={16} />
          </Link>
          <Link href="/acceso" className="btn btn-neutral btn-sm" style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            <LogIn size={16} /> Iniciar sesión
          </Link>
          <Link href="/registro?vista=registro" className="btn btn-primary btn-sm" style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            <UserPlus size={16} /> Registrarse
          </Link>
        </div>
      </div>

      <style>{`@media (max-width: 860px) { .site-nav { display: none !important; } }`}</style>
    </header>
  );
}
