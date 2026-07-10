"use client";

import Image from "next/image";
import Link from "next/link";
import { LogIn, UserPlus } from "lucide-react";
import VisitorChatDrawer from "@/components/chat/VisitorChatDrawer";
import NotificationBell from "@/components/notifications/NotificationBell";
import AccountMenu from "@/components/AccountMenu";
import MobileNav from "@/components/MobileNav";
import { useAuthStore } from "@/stores/authStore";

export interface NavLink {
  id: string;
  href: string;
  label: string;
}

/** Links por defecto (sitio logueado / navegación por rutas). */
const APP_LINKS: NavLink[] = [
  { id: "explorar", href: "/explorar", label: "Actividades" },
  { id: "establecimientos", href: "/establecimientos", label: "Establecimientos" },
  { id: "cultivos", href: "/cultivos", label: "Cultivos" },
  { id: "mis-reservas", href: "/mis-reservas", label: "Mis reservas" },
  { id: "faq", href: "/#faq", label: "Preguntas frecuentes" },
];

interface SiteHeaderProps {
  active?: string;
  /** Permite que el landing pase anclas de sección en lugar de rutas. */
  navLinks?: NavLink[];
  maxWidth?: number;
}

/**
 * Navbar única del sitio. Muestra condicionalmente el cluster de sesión
 * (chat + notificaciones + menú de cuenta) o los CTA de invitado
 * (Iniciar sesión / Registrarse), según el estado de auth del store.
 *
 * El cluster se renderiza sólo tras la hidratación para que el primer render del
 * cliente coincida con el del servidor (evita el flash de estado incorrecto).
 */
export default function SiteHeader({ active, navLinks = APP_LINKS, maxWidth = 1200 }: SiteHeaderProps) {
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  const nombre = useAuthStore((s) => s.nombre);
  const loggedIn = hasHydrated && !!nombre;

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
          maxWidth, margin: "0 auto", padding: "0 28px", height: 68,
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
          {navLinks.map(({ id, href, label }) => {
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
          {hasHydrated &&
            (loggedIn ? (
              <>
                <VisitorChatDrawer />
                <NotificationBell />
                <AccountMenu />
              </>
            ) : (
              <>
                <Link href="/acceso" className="btn btn-neutral btn-sm" style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                  <LogIn size={16} /> Iniciar sesión
                </Link>
                <Link href="/registro" className="btn btn-primary btn-sm" style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                  <UserPlus size={16} /> Registrarse
                </Link>
              </>
            ))}
          <MobileNav links={navLinks} active={active} />
        </div>
      </div>

      <style>{`@media (max-width: 860px) { .site-nav { display: none !important; } .site-mobile { display: block !important; } }`}</style>
    </header>
  );
}
