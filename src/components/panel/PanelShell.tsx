"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, BarChart3, Grape, CalendarCheck, MessageSquare, Home, Sprout,
  ChevronsUpDown, MapPin, Check, PlusCircle, Settings2, Compass, Menu, X, UserRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import NotificationBell from "@/components/notifications/NotificationBell";
import { admInitials } from "@/data/admin";
import { cn } from "@/lib/utils";
import { useEstablecimientos } from "@/hooks/useEstablecimientos";
import type { EstablecimientoAcceso } from "@/lib/roles";
import { useAuthStore } from "@/stores/authStore";
import { useEstablecimientoStore } from "@/stores/establecimientoStore";

interface NavItem {
  id: string;
  icon: LucideIcon;
  label: string;
  href: string;
  badge?: number;
}
type Row = { section: string } | NavItem;

/** Navegación del panel del productor, mapeada a las rutas reales del repo. */
const SIDEBAR: Row[] = [
  { section: "Análisis" },
  { id: "panel", icon: LayoutDashboard, label: "Panel", href: "/panel" },
  { id: "estadisticas", icon: BarChart3, label: "Estadísticas", href: "/panel/estadisticas" },
  { section: "Operación" },
  { id: "actividades", icon: Grape, label: "Experiencias", href: "/panel/actividades" },
  { id: "reservas", icon: CalendarCheck, label: "Reservas", href: "/panel/reservas" },
  { section: "Mensajes" },
  { id: "chats", icon: MessageSquare, label: "Chats", href: "/panel/chats", badge: 3 },
  { section: "Establecimiento" },
  { id: "datos", icon: Home, label: "Datos del establecimiento", href: "/panel/datos" },
  { id: "cultivos", icon: Sprout, label: "Cultivos", href: "/cultivos" },
];

// El alta de establecimiento vive en el espacio de visitante: el panel es sólo
// para establecimientos ya existentes.
const SOLICITAR_HREF = "/mis-solicitudes/nueva";

/**
 * TODO backend: la ubicación todavía no viaja en los accesos. Queda fija hasta
 * que el endpoint la mande, para no dejar el renglón vacío en el switcher.
 */
const UBICACION_MOCK = "Mendoza, Argentina";

/**
 * Ítem activo según la URL: el href más específico que sea prefijo del path,
 * para que `/panel/actividades` no marque también `/panel`.
 */
function idActivo(pathname: string): string {
  let largo = 0;
  let id = "";
  for (const row of SIDEBAR) {
    if ("section" in row) continue;
    const calza = pathname === row.href || pathname.startsWith(row.href + "/");
    if (calza && row.href.length > largo) {
      largo = row.href.length;
      id = row.id;
    }
  }
  return id;
}

/**
 * `true` por debajo del breakpoint del shell. La maqueta no depende de esto —la
 * resuelve el CSS con la variante `shell:`—; sólo alimenta lo que el CSS no
 * puede decir: si el cajón cuenta como abierto y si su contenido queda fuera
 * del alcance del lector de pantalla. Mismo criterio que en AdminShell.
 */
function useCompacto(): boolean {
  return useSyncExternalStore(
    (avisar) => {
      const mq = window.matchMedia("(max-width: 999.98px)");
      mq.addEventListener("change", avisar);
      return () => mq.removeEventListener("change", avisar);
    },
    () => window.matchMedia("(max-width: 999.98px)").matches,
    () => false,
  );
}

/** Cuadrado de 44px del shell: hamburguesa, cerrar, volver a explorar. */
const BTN_SHELL =
  "inline-flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-md border border-outline-variant bg-surface transition-colors hover:bg-cream-tert";

function FincaMark({
  nombre,
  active,
  size = 30,
}: {
  nombre: string;
  active?: boolean;
  size?: number;
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-lg font-display font-bold leading-none",
        active ? "bg-green-800 text-white" : "bg-green-050 text-green-800",
      )}
      style={{ width: size, height: size, fontSize: size <= 30 ? 12.5 : 14 }}
    >
      {admInitials(nombre || "?")}
    </span>
  );
}

/* ---- Switcher de establecimiento (cabecera del sidebar) ---------------- */
function EstablishmentSwitcher({
  lista,
  activo,
  onElegir,
}: {
  lista: EstablecimientoAcceso[];
  activo: EstablecimientoAcceso | null;
  onElegir: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const multiple = lista.length > 1;

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Sin establecimientos el camino es pedir el alta, no elegir nada.
  if (!activo) {
    return (
      <div className="px-3 pb-2.5">
        <Link
          href={SOLICITAR_HREF}
          className="flex items-center gap-2.5 rounded-md border border-dashed border-outline bg-cream-tert px-2.5 py-2 text-[13px] font-semibold text-green-800 no-underline hover:bg-green-050"
        >
          <PlusCircle className="size-[18px] shrink-0" />
          Solicitar alta de establecimiento
        </Link>
      </div>
    );
  }

  return (
    <div ref={wrapRef} className="relative px-3 pb-2.5">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Cambiar de establecimiento"
        onClick={() => multiple && setOpen((o) => !o)}
        className={cn(
          "flex w-full items-center gap-2.5 rounded-md border px-2.5 py-2 text-left transition-colors",
          open ? "border-green-800 bg-green-050" : "border-outline-variant bg-surface",
          multiple ? "cursor-pointer hover:bg-cream-tert" : "cursor-default",
        )}
      >
        <FincaMark nombre={activo.nombre} active />
        <span className="min-w-0 flex-1 leading-tight">
          <span className="block truncate text-[13.5px] font-semibold text-fg-1">
            {activo.nombre}
          </span>
          <span className="mt-0.5 flex items-center gap-1 truncate text-[11px] text-fg-3">
            <MapPin className="size-[11px] shrink-0" /> {UBICACION_MOCK}
          </span>
        </span>
        {multiple && (
          <ChevronsUpDown className={cn("size-4 shrink-0", open ? "text-green-800" : "text-fg-3")} />
        )}
      </button>

      {open && (
        <div
          role="listbox"
          aria-label="Tus establecimientos"
          className="pop absolute inset-x-3 top-[calc(100%-4px)] z-[60] overflow-hidden rounded-[14px] border border-outline-variant bg-surface shadow-pop"
        >
          <div className="px-4 pt-3 pb-2 text-[10.5px] font-semibold tracking-[0.08em] text-fg-3 uppercase">
            Cambiar de establecimiento
          </div>
          <div className="px-1.5">
            {lista.map((e) => {
              const isActive = e.id === activo.id;
              return (
                <button
                  key={e.id}
                  type="button"
                  role="option"
                  aria-selected={isActive}
                  onClick={() => {
                    onElegir(e.id);
                    setOpen(false);
                  }}
                  className={cn(
                    "mb-px flex w-full cursor-pointer items-center gap-2.5 rounded-[10px] px-2.5 py-2 text-left transition-colors",
                    isActive ? "bg-green-050" : "hover:bg-cream-tert",
                  )}
                >
                  <FincaMark nombre={e.nombre} active={isActive} />
                  <span className="min-w-0 flex-1">
                    <span
                      className={cn(
                        "block truncate text-[13.5px] font-semibold",
                        isActive ? "text-green-800" : "text-fg-1",
                      )}
                    >
                      {e.nombre}
                    </span>
                    <span className="mt-0.5 block truncate text-[11.5px] text-fg-3">
                      {e.rolNombre} · {UBICACION_MOCK}
                    </span>
                  </span>
                  {isActive ? <Check className="size-4 text-green-800" /> : <span className="w-4" />}
                </button>
              );
            })}
          </div>
          <div className="mx-3 my-1.5 h-px bg-outline-variant" />
          <Link
            href="/panel/datos"
            className="mx-1.5 flex items-center gap-2 rounded-[10px] px-2.5 py-2 text-[13px] font-semibold text-brown-700 no-underline hover:bg-cream-tert"
          >
            <Settings2 className="size-4" /> Gestionar establecimiento
          </Link>
          <Link
            href={SOLICITAR_HREF}
            className="mx-1.5 mb-1.5 flex items-center gap-2 rounded-[10px] px-2.5 py-2 text-[13px] font-semibold text-green-800 no-underline hover:bg-cream-tert"
          >
            <PlusCircle className="size-4" /> Solicitar alta de establecimiento
          </Link>
        </div>
      )}
    </div>
  );
}

/* ---- Barra de cuenta --------------------------------------------------- */
function AccountBar({ onMenu, rol }: { onMenu: () => void; rol: string }) {
  const nombre = useAuthStore((s) => s.nombre);
  const iniciales = admInitials(nombre ?? "");

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-2.5 border-b border-outline-variant bg-surface px-3.5 shell:gap-3 shell:px-7">
      <div className="flex min-w-0 flex-1 items-center gap-2.5">
        <button
          type="button"
          onClick={onMenu}
          aria-label="Abrir menú"
          className={cn(BTN_SHELL, "shell:hidden")}
        >
          <Menu className="size-5 text-fg-1" />
        </button>
        {/* En compacto queda sólo el icono, para dejarle el ancho a la campana
            y al avatar. */}
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

      <NotificationBell />

      <div className="hidden h-7 w-px bg-outline-variant shell:block" />

      {/* Ancho fijo: el nombre llega recién al rehidratar y con ancho automático
          la campana se corría al aparecer. Donde el diseño pone el nombre del
          establecimiento va el rol de la cuenta en él. */}
      <div className="hidden w-[170px] text-right leading-tight shell:block">
        <div className="truncate text-[12.5px] text-fg-3">{rol}</div>
        <div className="truncate text-[13.5px] font-semibold text-fg-1">{nombre ?? ""}</div>
      </div>

      <Link
        href="/cuenta"
        aria-label={nombre ? `Mi cuenta: ${nombre}` : "Mi cuenta"}
        className="inline-flex size-[38px] shrink-0 items-center justify-center rounded-full bg-brown-700 text-[13px] font-semibold text-white no-underline shadow-[inset_0_-2px_0_var(--brown-800)]"
      >
        {iniciales || <UserRound className="size-[18px]" />}
      </Link>
    </header>
  );
}

/**
 * Shell del panel del productor: sidebar —cajón por debajo del breakpoint— más
 * barra de cuenta. Mismo comportamiento responsive que AdminShell.
 */
export default function PanelShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const compacto = useCompacto();
  const active = idActivo(pathname);
  const [pedido, setPedido] = useState(false);
  const { lista, activo, elegir } = useEstablecimientos();

  // El store del establecimiento elegido usa skipHydration para que el primer
  // render del cliente coincida con el del servidor; se rehidrata acá, que es
  // el único punto por el que pasan todas las pantallas del panel.
  useEffect(() => {
    useEstablecimientoStore.persist.rehydrate();
  }, []);

  // El cajón sólo puede estar abierto en compacto: al ensanchar la ventana
  // vuelve a ser columna fija y deja de haber velo y bloqueo de scroll.
  const abierto = pedido && compacto;
  const cerrar = () => setPedido(false);

  useEffect(() => {
    if (!abierto) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPedido(false);
    };
    document.addEventListener("keydown", onKey);
    const previo = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previo;
    };
  }, [abierto]);

  return (
    <div className="min-h-screen bg-cream-bg">
      {/* Velo y cajón en el rango de los overlays: sobre el widget de asistencia
          (120) y debajo de Modal (140) y Toast (150). */}
      {abierto && (
        <div
          onClick={cerrar}
          aria-hidden
          className="fixed inset-0 z-[130] bg-[rgba(45,40,30,.42)] shell:hidden"
        />
      )}

      <aside
        aria-hidden={compacto && !abierto ? true : undefined}
        className={cn(
          "fixed inset-y-0 left-0 z-[135] flex w-[min(300px,86vw)] flex-col border-r border-outline-variant bg-surface",
          "transition-transform duration-200 ease-[cubic-bezier(.2,0,0,1)]",
          abierto ? "translate-x-0 shadow-pop" : "-translate-x-[101%]",
          "shell:z-30 shell:w-[264px] shell:translate-x-0 shell:shadow-none",
        )}
      >
        <div className="flex items-center">
          <Link
            href="/panel"
            className="flex min-w-0 flex-1 items-center gap-2.5 px-5 pt-5 pb-4 no-underline"
          >
            <Image src="/logo-mark.svg" width={32} height={32} alt="" />
            <span className="leading-none">
              <span className="block font-display text-[17px] font-bold text-green-800">
                Mendoza
              </span>
              <span className="mt-[3px] block text-[9.5px] font-semibold tracking-[0.12em] text-brown-700 uppercase">
                AgroTours
              </span>
            </span>
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

        <EstablishmentSwitcher lista={lista} activo={activo} onElegir={elegir} />

        <div className="mx-4 mb-1.5 h-px bg-outline-variant" />

        {/* Sin establecimiento no hay nada que navegar: la pantalla es el prompt
            de alta. Al elegir una sección el cajón se cierra solo. */}
        {activo && (
          <nav className="flex-1 overflow-y-auto pb-4" onClick={cerrar}>
            {SIDEBAR.map((row, i) =>
              "section" in row ? (
                <div
                  key={`s-${i}`}
                  className="px-5 pt-3.5 pb-1.5 text-[11px] font-semibold tracking-[0.08em] text-fg-3 uppercase"
                >
                  {row.section}
                </div>
              ) : (
                <Link
                  key={row.id}
                  href={row.href}
                  aria-current={active === row.id ? "page" : undefined}
                  className={cn(
                    "mx-2 my-px flex items-center gap-3 rounded-md px-3 py-2.5 text-[13.5px] no-underline transition-colors",
                    active === row.id
                      ? "bg-green-050 font-semibold text-green-800 shadow-[inset_0_-2px_0_var(--green-100)]"
                      : "font-medium text-fg-2 hover:bg-cream-tert",
                  )}
                >
                  <row.icon className="size-[17px] shrink-0" />
                  <span className="min-w-0 flex-1 truncate">{row.label}</span>
                  {row.badge != null && (
                    <span
                      className={cn(
                        "inline-flex h-[18px] min-w-[22px] items-center justify-center rounded-[9px] px-1.5 text-[11px] font-bold text-white",
                        active === row.id ? "bg-green-800" : "bg-brown-700",
                      )}
                    >
                      {row.badge}
                    </span>
                  )}
                </Link>
              ),
            )}
          </nav>
        )}
      </aside>

      <div className="shell:pl-[264px]">
        <AccountBar onMenu={() => setPedido(true)} rol={activo?.rolNombre ?? ""} />
        <main>{children}</main>
      </div>
    </div>
  );
}
