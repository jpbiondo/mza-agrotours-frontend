"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  LayoutDashboard, UserCog, ShieldCheck, ClipboardCheck, Warehouse, Sprout, Utensils,
  UsersRound, SlidersHorizontal, HandCoins, Landmark, LifeBuoy, HelpCircle, Compass,
  Bell, LogOut, Lock,
} from "lucide-react";

const SIDEBAR_W = 264;
const TOPBAR_H = 64;

/** Estructura del nav; los ítems sin href aún no están implementados (badge "pronto"). */
const NAV: { section?: string; id?: string; iconC?: React.ComponentType<{ size?: number; color?: string }>; label?: string; href?: string; badge?: number }[] = [
  { section: "General" },
  { id: "panel", iconC: LayoutDashboard, label: "Resumen del sistema", href: "/admin" },
  { section: "Acceso" },
  { id: "admins", iconC: UserCog, label: "Administradores", href: "/admin/administradores" },
  { id: "roles", iconC: ShieldCheck, label: "Roles de administrador", href: "/admin/roles" },
  { section: "Plataforma" },
  { id: "solicitudes", iconC: ClipboardCheck, label: "Solicitudes de establecimientos", href: "/admin/solicitudes", badge: 3 },
  { id: "establecimientos", iconC: Warehouse, label: "Establecimientos", href: "/admin/establecimientos" },
  { section: "Contenido" },
  { id: "cultivos", iconC: Sprout, label: "Cultivos" },
  { id: "recetas", iconC: Utensils, label: "Recetas" },
  { section: "Parámetros" },
  { id: "rangos", iconC: UsersRound, label: "Gestión del rango etario" },
  { id: "parametros", iconC: SlidersHorizontal, label: "Parámetros del sistema" },
  { section: "Deudas y reembolsos" },
  { id: "impagas", iconC: HandCoins, label: "Reservas impagas", href: "/admin/impagas" },
  { id: "deudas", iconC: Landmark, label: "Deudas de productores", href: "/admin/deudas" },
  { section: "Soporte" },
  { id: "incidencias", iconC: LifeBuoy, label: "Gestionar incidencias", href: "/admin/incidencias" },
  { id: "faq", iconC: HelpCircle, label: "Preguntas frecuentes", href: "/admin/faq" },
];

function SidebarItem({ entry, active }: { entry: typeof NAV[number]; active: boolean }) {
  const Icon = entry.iconC!;
  const color = active ? "var(--green-800)" : "var(--fg-2)";
  const inner = (
    <>
      <Icon size={17} color={color} />
      <span style={{ flex: 1, minWidth: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{entry.label}</span>
      {entry.badge != null && <span style={{ minWidth: 22, height: 18, padding: "0 7px", background: "var(--brown-700)", color: "#fff", borderRadius: 9, fontSize: 11, fontWeight: 700, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>{entry.badge}</span>}
      {!entry.href && <span style={{ fontSize: 9.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".04em", color: "var(--brown-700)", background: "var(--brown-100)", borderRadius: 999, padding: "1px 6px" }}>pronto</span>}
    </>
  );
  const style: React.CSSProperties = {
    display: "flex", alignItems: "center", gap: 12, margin: "1px 8px", padding: "9px 12px", textDecoration: "none",
    background: active ? "var(--green-050)" : "transparent", color: entry.href ? color : "var(--fg-3)",
    borderRadius: "var(--radius)", fontFamily: "var(--font-sans)", fontSize: 13.5, fontWeight: active ? 600 : 500,
    boxShadow: active ? "inset 0 -2px 0 var(--green-100)" : "none",
  };
  if (entry.href) return <Link href={entry.href} aria-current={active ? "page" : undefined} style={style}>{inner}</Link>;
  return <span style={{ ...style, cursor: "default" }} title="Próximamente">{inner}</span>;
}

function AccountBar() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDoc); document.removeEventListener("keydown", onKey); };
  }, [open]);

  const menu = [
    { icon: <HelpCircle size={18} color="var(--fg-2)" />, label: "Ayuda", href: "/#faq" },
    { icon: <Lock size={18} color="var(--fg-2)" />, label: "Acceso y seguridad", href: "/acceso" },
    { icon: <LogOut size={18} color="var(--fg-2)" />, label: "Cerrar sesión", href: "/acceso" },
  ];

  return (
    <header style={{ position: "sticky", top: 0, zIndex: 20, height: TOPBAR_H, background: "var(--surface)", borderBottom: "1px solid var(--outline-variant)", display: "flex", alignItems: "center", padding: "0 28px" }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 8, height: 40, padding: "0 14px", borderRadius: "var(--radius)", border: "1px solid var(--outline-variant)", background: "var(--surface)", color: "var(--green-800)", fontSize: 13.5, fontWeight: 600, textDecoration: "none", boxShadow: "inset 0 -2px 0 var(--green-100)" }}>
          <Compass size={16} color="var(--green-800)" /> Volver a explorar
        </Link>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "7px 13px", borderRadius: "var(--radius-pill)", background: "var(--cream-tert)", border: "1px solid var(--sand)", color: "var(--brown-700)", fontSize: 13, fontWeight: 600, whiteSpace: "nowrap" }} className="admin-mode-chip">
          <ShieldCheck size={15} color="var(--brown-700)" /> Modo administrador
        </span>
        <button type="button" aria-label="Notificaciones" style={{ position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center", width: 40, height: 40, borderRadius: "var(--radius)", border: "1px solid var(--outline-variant)", background: "var(--surface)", cursor: "pointer" }}>
          <Bell size={20} color="var(--fg-2)" />
          <span style={{ position: "absolute", top: -6, right: -6, width: 24, height: 24, borderRadius: "50%", background: "var(--danger)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, border: "2px solid var(--surface)" }}>3</span>
        </button>
        <div style={{ width: 1, height: 28, background: "var(--outline-variant)" }} />
        <div style={{ textAlign: "right", lineHeight: 1.2, maxWidth: 220 }} className="admin-user-block">
          <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--fg-1)" }}>Diego Ferreyra</div>
          <div style={{ fontSize: 11.5, color: "var(--fg-3)", marginTop: 2 }}>Administrador líder</div>
        </div>
        <div ref={ref} style={{ position: "relative" }}>
          <button type="button" aria-haspopup="menu" aria-expanded={open} aria-label="Mi cuenta" onClick={() => setOpen((v) => !v)} style={{ width: 38, height: 38, borderRadius: "50%", background: "var(--brown-700)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600, fontSize: 13, border: "none", cursor: "pointer", boxShadow: "inset 0 -2px 0 var(--brown-800)", outline: open ? "2px solid var(--green-800)" : "none", outlineOffset: 2 }}>DF</button>
          {open && (
            <div role="menu" className="pop" style={{ position: "absolute", top: "calc(100% + 10px)", right: 0, width: 240, background: "var(--surface)", border: "1px solid var(--outline-variant)", borderRadius: "var(--radius)", boxShadow: "var(--shadow-pop)", padding: 6, zIndex: 50 }}>
              {menu.map((it, i) => (
                <span key={it.label}>
                  {i === menu.length - 1 && <div style={{ height: 1, background: "var(--outline-variant)", margin: "6px 0" }} />}
                  <Link href={it.href} role="menuitem" onClick={() => setOpen(false)} style={{ display: "flex", alignItems: "center", gap: 11, padding: "9px 10px", borderRadius: "var(--radius)", textDecoration: "none", fontSize: 13.5, fontWeight: 500, color: "var(--fg-1)" }}>{it.icon} {it.label}</Link>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default function AdminShell({ active, children }: { active: string; children: React.ReactNode }) {
  return (
    <div style={{ minHeight: "100vh", background: "var(--cream-bg)" }}>
      <aside className="admin-sidebar" style={{ position: "fixed", left: 0, top: 0, bottom: 0, width: SIDEBAR_W, background: "var(--surface)", borderRight: "1px solid var(--outline-variant)", display: "flex", flexDirection: "column", zIndex: 30 }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, padding: "20px 20px 16px", textDecoration: "none" }}>
          <Image src="/logo-mark.svg" alt="" width={32} height={32} />
          <div style={{ lineHeight: 1 }}>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 17, color: "var(--green-800)" }}>Mendoza</div>
            <div style={{ fontSize: 9.5, letterSpacing: ".12em", textTransform: "uppercase", fontWeight: 600, color: "var(--brown-700)", marginTop: 3 }}>AgroTours</div>
          </div>
        </Link>
        <div style={{ padding: "0 12px 12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px", border: "1px solid var(--sand)", borderRadius: "var(--radius)", background: "var(--cream-tert)" }}>
            <span style={{ flexShrink: 0, width: 32, height: 32, borderRadius: 8, background: "var(--brown-700)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "inset 0 -2px 0 var(--brown-800)" }}><ShieldCheck size={17} color="#fff" /></span>
            <span style={{ minWidth: 0 }}>
              <span style={{ display: "block", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, color: "var(--fg-1)", lineHeight: 1.1 }}>Administración</span>
              <span style={{ display: "block", fontSize: 11, color: "var(--brown-700)", fontWeight: 600, marginTop: 2 }}>Panel del sistema</span>
            </span>
          </div>
        </div>
        <div style={{ height: 1, background: "var(--outline-variant)", margin: "0 16px 6px" }} />
        <nav style={{ paddingBottom: 16, overflowY: "auto", flex: 1 }}>
          {NAV.map((e, i) => e.section
            ? <div key={"s" + i} style={{ padding: "14px 20px 6px", fontSize: 11, fontWeight: 600, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--fg-3)" }}>{e.section}</div>
            : <SidebarItem key={e.id} entry={e} active={active === e.id} />)}
        </nav>
      </aside>

      <div className="admin-main" style={{ marginLeft: SIDEBAR_W }}>
        <AccountBar />
        <main>{children}</main>
      </div>

      <style>{`
        @media (max-width: 980px) {
          .admin-sidebar { display: none !important; }
          .admin-main { margin-left: 0 !important; }
        }
        @media (max-width: 560px) { .admin-mode-chip, .admin-user-block { display: none !important; } }
      `}</style>
    </div>
  );
}
