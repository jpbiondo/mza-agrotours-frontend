"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import type { ComponentType, ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, UserCog, ShieldCheck, ClipboardCheck, Warehouse, Sprout, Utensils,
  UsersRound, SlidersHorizontal, HandCoins, Landmark, LifeBuoy, HelpCircle, Compass,
  Bell, LogOut, Lock, Menu, X,
} from "lucide-react";
import { puede } from "@/lib/roles";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/authStore";

interface NavEntry {
  section?: string;
  id?: string;
  iconC?: ComponentType<{ className?: string }>;
  label?: string;
  href?: string;
  badge?: number;
  permiso?: string;
}

/**
 * Estructura del nav; los ítems sin href aún no están implementados (badge "pronto").
 * `permiso` esconde la entrada a quien no lo tiene; los ítems que no lo declaran
 * quedan visibles para cualquier administrador.
 */
const NAV: NavEntry[] = [
  { section: "General" },
  { id: "panel", iconC: LayoutDashboard, label: "Resumen del sistema", href: "/admin" },
  { section: "Acceso" },
  { id: "admins", iconC: UserCog, label: "Administradores", href: "/admin/administradores", permiso: "LEER_ADMIN" },
  { id: "roles", iconC: ShieldCheck, label: "Roles de administrador", href: "/admin/roles", permiso: "LEER_ROL" },
  { section: "Plataforma" },
  { id: "solicitudes", iconC: ClipboardCheck, label: "Solicitudes de establecimientos", href: "/admin/solicitudes", permiso: "LEER_SOLICITUD_ESTABLECIMIENTO" },
  { id: "establecimientos", iconC: Warehouse, label: "Establecimientos", href: "/admin/establecimientos" },
  { section: "Contenido" },
  { id: "cultivos", iconC: Sprout, label: "Cultivos", href: "/admin/cultivos" },
  { id: "recetas", iconC: Utensils, label: "Recetas", href: "/admin/recetas" },
  { section: "Parámetros" },
  { id: "rangos", iconC: UsersRound, label: "Gestión del rango etario", href: "/admin/rangos" },
  { id: "parametros", iconC: SlidersHorizontal, label: "Parámetros del sistema", href: "/admin/parametros" },
  { section: "Deudas y reembolsos" },
  { id: "impagas", iconC: HandCoins, label: "Reservas impagas", href: "/admin/impagas" },
  { id: "deudas", iconC: Landmark, label: "Deudas de productores", href: "/admin/deudas" },
  { section: "Soporte" },
  { id: "incidencias", iconC: LifeBuoy, label: "Gestionar incidencias", href: "/admin/incidencias" },
  { id: "faq", iconC: HelpCircle, label: "Preguntas frecuentes", href: "/admin/faq" },
];

/**
 * Ítem activo según la URL: el href más específico que sea prefijo del path.
 * Así `/admin/roles` marca "Roles" y no "Resumen", cuyo href `/admin` también
 * calza. Sale del pathname y no de una prop para que no puedan desincronizarse.
 */
function idActivo(pathname: string): string {
  let largo = 0;
  let id = "";
  for (const e of NAV) {
    if (!e.href || !e.id) continue;
    const calza = pathname === e.href || pathname.startsWith(e.href + "/");
    if (calza && e.href.length > largo) {
      largo = e.href.length;
      id = e.id;
    }
  }
  return id;
}

/**
 * `true` por debajo del breakpoint del shell, donde la barra lateral es un
 * cajón. Ojo: **la maqueta no depende de esto**, la resuelve el CSS con la
 * variante `shell:`. Si el ancho decidiera el layout desde JS, la primera
 * pintura sería siempre la de escritorio y en un teléfono se vería el salto.
 *
 * Esto sólo alimenta lo que el CSS no puede: si el cajón cuenta como abierto y
 * si su contenido queda fuera del alcance del lector de pantalla y del tabulado.
 */
function useCompacto(): boolean {
  return useSyncExternalStore(
    (avisar) => {
      const mq = window.matchMedia("(max-width: 999.98px)");
      mq.addEventListener("change", avisar);
      return () => mq.removeEventListener("change", avisar);
    },
    () => window.matchMedia("(max-width: 999.98px)").matches,
    () => false, // En el servidor no hay viewport: se asume escritorio.
  );
}

/** Cuadrado de 44px del shell: hamburguesa, cerrar, volver a explorar. */
const BTN_SHELL =
  "inline-flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-md border border-outline-variant bg-surface transition-colors hover:bg-cream-tert";

function SidebarItem({ entry, active }: { entry: NavEntry; active: boolean }) {
  const Icono = entry.iconC!;
  const contenido = (
    <>
      <Icono className="size-[17px] shrink-0" />
      <span className="min-w-0 flex-1 truncate">{entry.label}</span>
      {entry.badge != null && (
        <span className="inline-flex h-[18px] min-w-[22px] items-center justify-center rounded-[9px] bg-brown-700 px-[7px] text-[11px] leading-none font-bold text-white">
          {entry.badge}
        </span>
      )}
      {!entry.href && (
        <span className="rounded-pill bg-brown-100 px-1.5 py-px text-[9.5px] font-bold tracking-[.04em] text-brown-700 uppercase">
          pronto
        </span>
      )}
    </>
  );

  const clases = cn(
    "mx-2 my-px flex items-center gap-3 rounded-md px-3 py-[9px] font-sans text-[13.5px] no-underline transition-colors",
    active
      ? "bg-green-050 font-semibold text-green-800 shadow-[inset_0_-2px_0_var(--green-100)]"
      : entry.href
        ? "font-medium text-fg-2 hover:bg-cream-tert"
        : "font-medium text-fg-3",
  );

  if (entry.href) {
    return (
      <Link href={entry.href} aria-current={active ? "page" : undefined} className={clases}>
        {contenido}
      </Link>
    );
  }
  return (
    <span className={cn(clases, "cursor-default")} title="Próximamente">
      {contenido}
    </span>
  );
}

function AccountBar({ onMenu }: { onMenu: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const menu = [
    { icon: <HelpCircle className="size-[18px] text-fg-2" />, label: "Ayuda", href: "/#faq" },
    { icon: <Lock className="size-[18px] text-fg-2" />, label: "Acceso y seguridad", href: "/acceso" },
    { icon: <LogOut className="size-[18px] text-fg-2" />, label: "Cerrar sesión", href: "/acceso" },
  ];

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-2.5 border-b border-outline-variant bg-surface px-3.5 shell:gap-0 shell:px-7">
      <div className="flex min-w-0 flex-1 items-center gap-2.5">
        <button type="button" onClick={onMenu} aria-label="Abrir menú" className={cn(BTN_SHELL, "shell:hidden")}>
          <Menu className="size-5 text-fg-1" />
        </button>
        {/* En compacto queda sólo el icono: el rótulo se lleva el ancho que
            necesitan la campana y el avatar. */}
        <Link
          href="/explorar"
          aria-label="Volver a explorar como visitante"
          title="Volver a explorar"
          className={cn(
            BTN_SHELL,
            "gap-2 text-[13.5px] font-semibold text-green-800 no-underline",
            "shell:h-10 shell:w-auto shell:px-3.5 shell:shadow-[inset_0_-2px_0_var(--green-100)]",
          )}
        >
          <Compass className="size-4 shrink-0" />
          <span className="hidden shell:inline">Volver a explorar</span>
        </Link>
      </div>

      <div className="flex items-center gap-2 shell:gap-3.5">
        <span className="hidden items-center gap-[7px] rounded-pill border border-sand bg-cream-tert px-3.5 py-[7px] text-[13px] font-semibold whitespace-nowrap text-brown-700 shell:inline-flex">
          <ShieldCheck className="size-[15px]" /> Modo administrador
        </span>

        <button type="button" aria-label="Notificaciones" className={cn(BTN_SHELL, "relative shell:size-10")}>
          <Bell className="size-5 text-fg-2" />
          <span className="absolute -top-1.5 -right-1.5 flex size-6 items-center justify-center rounded-full border-2 border-surface bg-danger text-[11px] font-bold text-white">
            3
          </span>
        </button>

        <div className="hidden h-7 w-px bg-outline-variant shell:block" />

        <div className="hidden max-w-[220px] text-right leading-tight shell:block">
          <div className="text-[13.5px] font-semibold text-fg-1">Diego Ferreyra</div>
          <div className="mt-0.5 text-[11.5px] text-fg-3">Administrador líder</div>
        </div>

        <div ref={ref} className="relative">
          <button
            type="button"
            aria-haspopup="menu"
            aria-expanded={open}
            aria-label="Mi cuenta"
            onClick={() => setOpen((v) => !v)}
            className={cn(
              "flex size-[38px] cursor-pointer items-center justify-center rounded-full bg-brown-700 text-[13px] font-semibold text-white shadow-[inset_0_-2px_0_var(--brown-800)]",
              open && "outline-2 outline-offset-2 outline-green-800",
            )}
          >
            DF
          </button>
          {open && (
            <div
              role="menu"
              className="pop absolute top-[calc(100%+10px)] right-0 z-50 w-60 rounded-md border border-outline-variant bg-surface p-1.5 shadow-pop"
            >
              {menu.map((it, i) => (
                <span key={it.label}>
                  {i === menu.length - 1 && <div className="my-1.5 h-px bg-outline-variant" />}
                  <Link
                    href={it.href}
                    role="menuitem"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-[11px] rounded-md px-2.5 py-[9px] text-[13.5px] font-medium text-fg-1 no-underline hover:bg-cream-tert"
                  >
                    {it.icon} {it.label}
                  </Link>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const accesos = useAuthStore((s) => s.accesos);
  const compacto = useCompacto();
  const active = idActivo(pathname);
  const [pedido, setPedido] = useState(false);

  // El cajón sólo puede estar abierto en compacto: al ensanchar la ventana
  // vuelve a ser columna fija y deja de haber velo y bloqueo de scroll, sin
  // necesidad de resetear nada.
  const abierto = pedido && compacto;
  const cerrar = () => setPedido(false);

  useEffect(() => {
    if (!abierto) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPedido(false);
    };
    document.addEventListener("keydown", onKey);
    // El fondo no se mueve detrás del velo.
    const previo = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previo;
    };
  }, [abierto]);

  // Antes de que el store rehidrate, `accesos` está vacío y los ítems con
  // permiso no se dibujan; aparecen un frame después. Se prefiere ese orden al
  // inverso: mostrar una entrada que la cuenta no tiene y después sacarla sería
  // enseñar acceso que no existe.
  const navVisible = useMemo(() => {
    const conPermiso = NAV.filter((e) => !e.permiso || puede(accesos, e.permiso));
    // Si los ítems de una sección se filtraron todos, su rótulo quedaría suelto:
    // se conserva sólo cuando lo sigue un ítem.
    return conPermiso.filter((e, i) => {
      if (!e.section) return true;
      const siguiente = conPermiso[i + 1];
      return !!siguiente && !siguiente.section;
    });
  }, [accesos]);

  return (
    <div className="min-h-screen bg-cream-bg">
      {/* Velo y cajón viajan en el rango de los overlays (por encima del widget
          de asistencia, que va en 120, y por debajo de Modal y Toast). Como
          columna fija, en cambio, la barra vuelve a z-30: ahí no tapa nada. */}
      {abierto && (
        <div
          onClick={cerrar}
          aria-hidden
          className="fixed inset-0 z-[130] bg-[rgba(45,40,30,.42)] shell:hidden"
        />
      )}

      <aside
        // Fuera del breakpoint es columna fija; dentro, un cajón que entra desde
        // la izquierda. Las dos formas son CSS, así que la primera pintura ya es
        // la correcta en cualquier ancho.
        aria-hidden={compacto && !abierto ? true : undefined}
        className={cn(
          "fixed inset-y-0 left-0 z-[135] flex w-[min(300px,86vw)] flex-col border-r border-outline-variant bg-surface",
          "transition-transform duration-200 ease-[cubic-bezier(.2,0,0,1)]",
          abierto ? "translate-x-0 shadow-pop" : "-translate-x-[101%]",
          "shell:z-30 shell:w-[264px] shell:translate-x-0 shell:shadow-none",
        )}
      >
        <div className="flex items-center">
          <Link href="/" className="flex min-w-0 flex-1 items-center gap-2.5 px-5 pt-5 pb-4 no-underline">
            <Image src="/logo-mark.svg" alt="" width={32} height={32} />
            <div className="leading-none">
              <div className="font-display text-[17px] font-bold text-green-800">Mendoza</div>
              <div className="mt-[3px] text-[9.5px] font-semibold tracking-[.12em] text-brown-700 uppercase">
                AgroTours
              </div>
            </div>
          </Link>
          <button
            type="button"
            onClick={cerrar}
            aria-label="Cerrar menú"
            className={cn(BTN_SHELL, "mr-4 shell:hidden")}
          >
            <X className="size-5 text-fg-2" />
          </button>
        </div>

        <div className="px-3 pb-3">
          <div className="flex items-center gap-2.5 rounded-md border border-sand bg-cream-tert p-2.5">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-brown-700 shadow-[inset_0_-2px_0_var(--brown-800)]">
              <ShieldCheck className="size-[17px] text-white" />
            </span>
            <span className="min-w-0">
              <span className="block font-display text-sm leading-tight font-bold text-fg-1">
                Administración
              </span>
              <span className="mt-0.5 block text-[11px] font-semibold text-brown-700">
                Panel del sistema
              </span>
            </span>
          </div>
        </div>

        <div className="mx-4 mb-1.5 h-px bg-outline-variant" />

        {/* Al elegir una sección el cajón se cierra solo; en escritorio no hace
            nada, porque ahí nunca está abierto. */}
        <nav className="flex-1 overflow-y-auto pb-4" onClick={cerrar}>
          {navVisible.map((e, i) =>
            e.section ? (
              <div
                key={"s" + i}
                className="px-5 pt-3.5 pb-1.5 text-[11px] font-semibold tracking-[.08em] text-fg-3 uppercase"
              >
                {e.section}
              </div>
            ) : (
              <SidebarItem key={e.id} entry={e} active={active === e.id} />
            ),
          )}
        </nav>
      </aside>

      <div className="shell:pl-[264px]">
        <AccountBar onMenu={() => setPedido(true)} />
        <main>{children}</main>
      </div>
    </div>
  );
}
