"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  LayoutDashboard, BarChart3, Grape, CalendarCheck, MessageSquare, Home, Sprout,
  ChevronsUpDown, MapPin, Check, PlusCircle, Settings2, Compass,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import NotificationBell from "@/components/notifications/NotificationBell";
import { FINCAS } from "@/data/panel";
import type { Finca } from "@/types/panel";
import { useAuthStore } from "@/stores/authStore";
import { cn } from "@/lib/utils";

const SIDEBAR_W = "w-[264px]";

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

const SOLICITAR_HREF = "/panel/establecimientos/solicitar";

function fincaInitials(name: string): string {
  const skip = new Set(["finca", "bodega", "la", "el", "los", "las", "de", "del"]);
  const w = name.split(/\s+/).filter((x) => x && !skip.has(x.toLowerCase()));
  return w.slice(0, 2).map((x) => x[0]).join("").toUpperCase();
}

function FincaMark({ name, active, size = 30 }: { name: string; active?: boolean; size?: number }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-lg font-display font-bold leading-none",
        active ? "bg-green-800 text-white" : "bg-green-050 text-green-800"
      )}
      style={{ width: size, height: size, fontSize: size <= 30 ? 12.5 : 14 }}
    >
      {fincaInitials(name)}
    </span>
  );
}

/* ---- Establishment switcher (sidebar header) --------------------------- */
function EstablishmentSwitcher({ fincas }: { fincas: Finca[] }) {
  const [activeId, setActiveId] = useState(fincas[0]?.id ?? "");
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const finca = fincas.find((f) => f.id === activeId) ?? fincas[0];
  const multiple = fincas.length > 1;

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, [open]);

  // Sin establecimientos: prompt para solicitar el alta.
  if (!finca) {
    return (
      <div className="px-3 pb-2.5">
        <Link
          href={SOLICITAR_HREF}
          className="flex items-center gap-2.5 rounded-md border border-dashed border-outline bg-cream-tert px-2.5 py-2 text-[13px] font-semibold text-green-800 hover:bg-green-050"
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
          multiple ? "cursor-pointer hover:bg-cream-tert" : "cursor-default"
        )}
      >
        <FincaMark name={finca.nombre} active />
        <span className="min-w-0 flex-1 leading-tight">
          <span className="block truncate text-[13.5px] font-semibold text-fg-1">{finca.nombre}</span>
          <span className="mt-0.5 flex items-center gap-1 truncate text-[11px] text-fg-3">
            <MapPin className="size-[11px]" /> {finca.location}
          </span>
        </span>
        {multiple && <ChevronsUpDown className={cn("size-4 shrink-0", open ? "text-green-800" : "text-fg-3")} />}
      </button>

      {open && (
        <div className="absolute inset-x-3 top-[calc(100%-4px)] z-[60] overflow-hidden rounded-[14px] border border-outline-variant bg-surface shadow-pop">
          <div className="px-4 pt-3 pb-2 text-[10.5px] font-semibold tracking-[0.08em] text-fg-3 uppercase">
            Cambiar de establecimiento
          </div>
          <div className="px-1.5">
            {fincas.map((f) => {
              const isActive = f.id === finca.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  role="option"
                  aria-selected={isActive}
                  onClick={() => { setActiveId(f.id); setOpen(false); }}
                  className={cn(
                    "mb-px flex w-full items-center gap-2.5 rounded-[10px] px-2.5 py-2 text-left transition-colors",
                    isActive ? "bg-green-050" : "hover:bg-cream-tert"
                  )}
                >
                  <FincaMark name={f.nombre} active={isActive} />
                  <span className="min-w-0 flex-1">
                    <span className={cn("block truncate text-[13.5px] font-semibold", isActive ? "text-green-800" : "text-fg-1")}>{f.nombre}</span>
                    <span className="mt-0.5 block truncate text-[11.5px] text-fg-3">{f.role} · {f.location}</span>
                  </span>
                  {isActive ? <Check className="size-4 text-green-800" /> : <span className="w-4" />}
                </button>
              );
            })}
          </div>
          <div className="my-1.5 mx-3 h-px bg-outline-variant" />
          <Link href="/panel/datos" className="mx-1.5 flex items-center gap-2 rounded-[10px] px-2.5 py-2 text-[13px] font-semibold text-brown-700 hover:bg-cream-tert">
            <Settings2 className="size-4" /> Gestionar establecimiento
          </Link>
          <Link href={SOLICITAR_HREF} className="mx-1.5 mb-1.5 flex items-center gap-2 rounded-[10px] px-2.5 py-2 text-[13px] font-semibold text-green-800 hover:bg-cream-tert">
            <PlusCircle className="size-4" /> Solicitar alta de establecimiento
          </Link>
        </div>
      )}
    </div>
  );
}

/* ---- Sidebar ----------------------------------------------------------- */
function Sidebar({ active, fincas }: { active: string; fincas: Finca[] }) {
  const hasFinca = fincas.length > 0;
  return (
    <aside className={cn("fixed inset-y-0 left-0 z-30 hidden flex-col border-r border-outline-variant bg-surface lg:flex", SIDEBAR_W)}>
      <Link href="/panel" className="flex items-center gap-2.5 px-5 pt-5 pb-4">
        <Image src="/logo-mark.svg" width={32} height={32} alt="" />
        <span className="leading-none">
          <span className="block font-display text-[17px] font-bold text-green-800">Mendoza</span>
          <span className="mt-[3px] block text-[9.5px] font-semibold tracking-[0.12em] text-brown-700 uppercase">AgroTours</span>
        </span>
      </Link>

      <EstablishmentSwitcher fincas={fincas} />

      <div className="mx-4 mb-1.5 h-px bg-outline-variant" />

      {hasFinca && (
        <nav className="flex-1 overflow-y-auto pb-4">
          {SIDEBAR.map((row, i) =>
            "section" in row ? (
              <div key={`s-${i}`} className="px-5 pt-3.5 pb-1.5 text-[11px] font-semibold tracking-[0.08em] text-fg-3 uppercase">
                {row.section}
              </div>
            ) : (
              <Link
                key={row.id}
                href={row.href}
                aria-current={active === row.id ? "page" : undefined}
                className={cn(
                  "mx-2 my-px flex items-center gap-3 rounded-md px-3 py-2.5 text-[13.5px] transition-colors",
                  active === row.id
                    ? "bg-green-050 font-semibold text-green-800 shadow-[inset_0_-2px_0_var(--green-100)]"
                    : "font-medium text-fg-2 hover:bg-cream-tert"
                )}
              >
                <row.icon className="size-[17px] shrink-0" />
                <span className="min-w-0 flex-1 truncate">{row.label}</span>
                {row.badge != null && (
                  <span className={cn(
                    "inline-flex h-[18px] min-w-[22px] items-center justify-center rounded-[9px] px-1.5 text-[11px] font-bold text-white",
                    active === row.id ? "bg-green-800" : "bg-brown-700"
                  )}>{row.badge}</span>
                )}
              </Link>
            )
          )}
        </nav>
      )}
    </aside>
  );
}

/* ---- Account top bar --------------------------------------------------- */
function AccountTopbar() {
  const nombre = useAuthStore((s) => s.nombre) ?? "Lucía Funes";
  const initials = nombre.split(" ").map((s) => s[0]).join("").slice(0, 2).toUpperCase();

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-outline-variant bg-surface px-7">
      <div className="flex-1">
        <Link
          href="/explorar"
          className="inline-flex h-10 items-center gap-2 rounded-md border border-outline-variant bg-surface px-3.5 text-[13.5px] font-semibold text-green-800 shadow-[inset_0_-2px_0_var(--green-100)] hover:bg-cream-tert"
        >
          <Compass className="size-4" /> Volver a explorar
        </Link>
      </div>
      <NotificationBell />
      <div className="h-7 w-px bg-outline-variant" />
      <div className="hidden text-right leading-tight sm:block">
        <div className="text-[12.5px] text-fg-3">Productora</div>
        <div className="text-[13.5px] font-semibold text-fg-1">{nombre}</div>
      </div>
      <Link
        href="/cuenta"
        aria-label="Mi cuenta"
        className="inline-flex size-[38px] items-center justify-center rounded-full bg-brown-700 text-[13px] font-semibold text-white shadow-[inset_0_-2px_0_var(--brown-800)]"
      >
        {initials}
      </Link>
    </header>
  );
}

interface ProducerPanelShellProps {
  active?: string;
  fincas?: Finca[];
  children: React.ReactNode;
}

/** Shell del panel del productor: sidebar fija (lg+) + barra de cuenta slim. */
export default function ProducerPanelShell({
  active = "",
  fincas = FINCAS,
  children,
}: ProducerPanelShellProps) {
  return (
    <div className="min-h-screen bg-cream-bg">
      <Sidebar active={active} fincas={fincas} />
      <div className="lg:pl-[264px]">
        <AccountTopbar />
        {children}
      </div>
    </div>
  );
}
