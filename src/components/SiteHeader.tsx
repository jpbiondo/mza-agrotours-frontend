"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogIn, UserPlus } from "lucide-react";
import VisitorChatDrawer from "@/components/chat/VisitorChatDrawer";
import NotificationBell from "@/components/notifications/NotificationBell";
import AccountMenu from "@/components/AccountMenu";
import MobileNav from "@/components/MobileNav";
import { cn } from "@/lib/utils";
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

/**
 * Rutas que no tienen entrada propia en el nav pero cuelgan de una. Las recetas
 * se llegan desde Cultivos, así que marcan ese ítem.
 */
const ALIAS: Record<string, string> = { "/recetas": "cultivos" };

/**
 * Ítem activo según la URL: el href más específico que sea prefijo del path.
 * Sale del pathname y no de una prop para que no puedan desincronizarse, y para
 * que el header pueda vivir en el layout en vez de repetirse en cada pantalla.
 * Las anclas del landing (`/#faq`) no participan.
 */
function idActivo(pathname: string, links: NavLink[]): string | undefined {
  for (const [prefijo, id] of Object.entries(ALIAS)) {
    if (pathname === prefijo || pathname.startsWith(prefijo + "/")) return id;
  }
  let largo = 0;
  let id: string | undefined;
  for (const l of links) {
    if (l.href.includes("#")) continue;
    const calza = pathname === l.href || pathname.startsWith(l.href + "/");
    if (calza && l.href.length > largo) {
      largo = l.href.length;
      id = l.id;
    }
  }
  return id;
}

interface SiteHeaderProps {
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
export default function SiteHeader({ navLinks = APP_LINKS, maxWidth = 1200 }: SiteHeaderProps) {
  const pathname = usePathname();
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  const nombre = useAuthStore((s) => s.nombre);
  const loggedIn = hasHydrated && !!nombre;
  const active = idActivo(pathname, navLinks);

  return (
    <header className="sticky top-0 z-30 border-b border-outline-variant bg-cream-bg/92 backdrop-blur-[8px]">
      {/* `maxWidth` es dinámico —el landing usa uno más angosto—, así que es de
          los pocos valores que siguen yendo inline. */}
      <div
        style={{ maxWidth }}
        className="mx-auto flex h-[68px] items-center justify-between gap-6 px-7"
      >
        <Link href="/" className="flex items-center gap-[11px] no-underline">
          <Image src="/logo-mark.svg" width={36} height={36} alt="Mendoza AgroTours logo" />
          <div className="leading-none">
            <div className="font-display text-[18px] font-bold text-green-800">Mendoza</div>
            <div className="mt-0.5 text-[10px] font-semibold tracking-[.12em] text-brown-700 uppercase">
              AgroTours
            </div>
          </div>
        </Link>

        {/* Debajo del corte los links se pliegan en el menú de <MobileNav>. */}
        <nav className="hidden items-center gap-1 nav:flex">
          {navLinks.map(({ id, href, label }) => (
            <Link
              key={id}
              href={href}
              className={cn(
                "rounded-md px-3.5 py-2 text-[14.5px] no-underline",
                id === active
                  ? "bg-green-050 font-semibold text-green-800"
                  : "font-medium text-fg-2",
              )}
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Ancho reservado: el cluster de sesión y los CTA de invitado no miden
            lo mismo, y arrancando en cero el nav saltaba 124 px al hidratar.
            248 px es el ancho medido del estado más ancho. Sólo hace falta con
            el nav a la vista: sin él, el bloque crece contra el borde derecho y
            no mueve a nadie. */}
        <div className="flex items-center justify-end gap-2.5 nav:min-w-[248px]">
          {hasHydrated &&
            (loggedIn ? (
              <>
                <VisitorChatDrawer />
                <NotificationBell />
                <AccountMenu />
              </>
            ) : (
              <>
                <Link href="/acceso" className="btn btn-neutral btn-sm inline-flex items-center gap-2">
                  <LogIn className="size-4" /> Iniciar sesión
                </Link>
                <Link href="/registro" className="btn btn-primary btn-sm inline-flex items-center gap-2">
                  <UserPlus className="size-4" /> Registrarse
                </Link>
              </>
            ))}
          <MobileNav links={navLinks} active={active} />
        </div>
      </div>
    </header>
  );
}
