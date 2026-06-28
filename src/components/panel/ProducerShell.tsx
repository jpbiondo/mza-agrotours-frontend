"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronDown, ArrowRight, Bell, ExternalLink } from "lucide-react";
import type { Finca } from "@/types/panel";

function fincaInitials(name: string): string {
  const skip = new Set(["finca", "bodega", "la", "el", "los", "las", "de", "del"]);
  const w = name.split(/\s+/).filter((x) => x && !skip.has(x.toLowerCase()));
  return w.slice(0, 2).map((x) => x[0]).join("").toUpperCase();
}

function FincaMark({ name, size = 32 }: { name: string; size?: number }) {
  return (
    <span style={{ flexShrink: 0, width: size, height: size, borderRadius: 8, display: "inline-flex", alignItems: "center", justifyContent: "center", background: "var(--green-050)", color: "var(--green-800)", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: size <= 32 ? 13 : 15, lineHeight: 1, boxShadow: "inset 0 -2px 0 var(--green-100)" }}>
      {fincaInitials(name)}
    </span>
  );
}

/* Items de navegación del panel. `soon` = pantalla aún no implementada. */
const NAV: { id: string; label: string; href?: string; soon?: boolean }[] = [
  { id: "panel", label: "Panel", href: "/panel" },
  { id: "actividades", label: "Experiencias", soon: true },
  { id: "calendario", label: "Calendario", soon: true },
  { id: "cultivos", label: "Cultivos", soon: true },
  { id: "reservas", label: "Reservas", href: "/panel/reservas" },
  { id: "datos", label: "Datos", soon: true },
];

interface ProducerShellProps {
  active: string;
  fincas: Finca[];
  activeFincaId: string;
  onFincaChange: (id: string) => void;
}

export default function ProducerShell({ active, fincas, activeFincaId, onFincaChange }: ProducerShellProps) {
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const finca = fincas.find((f) => f.id === activeFincaId) ?? fincas[0];

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (wrap.current && !wrap.current.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, [open]);

  return (
    <header style={{ position: "sticky", top: 0, zIndex: 40, background: "rgba(251,249,248,.92)", backdropFilter: "blur(8px)", borderBottom: "1px solid var(--outline-variant)" }}>
      <div style={{ maxWidth: 1240, margin: "0 auto", padding: "0 28px", height: 72, display: "flex", alignItems: "center", gap: 20 }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 11, textDecoration: "none", flexShrink: 0 }}>
          <Image src="/logo-mark.svg" width={34} height={34} alt="Mendoza AgroTours" />
          <div style={{ lineHeight: 1 }}>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 16, color: "var(--green-800)" }}>Mendoza</div>
            <div style={{ fontSize: 9, letterSpacing: ".12em", textTransform: "uppercase", fontWeight: 600, color: "var(--brown-700)", marginTop: 2 }}>AgroTours</div>
          </div>
        </Link>

        {/* Selector de finca */}
        <div ref={wrap} style={{ position: "relative", flexShrink: 0 }}>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-haspopup="menu"
            aria-expanded={open}
            style={{ display: "inline-flex", alignItems: "center", gap: 10, height: 44, padding: "0 12px", borderRadius: "var(--radius)", border: "1px solid var(--outline-variant)", background: open ? "var(--cream-tert)" : "var(--surface)", cursor: "pointer" }}
          >
            <FincaMark name={finca.nombre} />
            <span style={{ textAlign: "left", lineHeight: 1.2, minWidth: 0 }} className="finca-meta">
              <span style={{ display: "block", fontSize: 13.5, fontWeight: 600, color: "var(--fg-1)", whiteSpace: "nowrap" }}>{finca.nombre}</span>
              <span style={{ display: "block", fontSize: 11.5, color: "var(--fg-3)", whiteSpace: "nowrap" }}>{finca.role}</span>
            </span>
            <ChevronDown size={16} color="var(--fg-3)" style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform .16s" }} />
          </button>

          {open && (
            <div role="menu" style={{ position: "absolute", top: "calc(100% + 8px)", left: 0, width: 320, background: "var(--surface)", border: "1px solid var(--outline-variant)", borderRadius: 14, boxShadow: "var(--shadow-pop)", overflow: "hidden", zIndex: 60 }} className="pop">
              <div style={{ padding: "14px 16px 12px", borderBottom: "1px solid var(--outline-variant)", background: "var(--cream-tert)" }}>
                <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15, color: "var(--green-800)" }}>Cambiar de establecimiento</div>
                <div style={{ fontSize: 12, color: "var(--fg-3)", marginTop: 3 }}>Elegí qué finca querés administrar</div>
              </div>
              <div style={{ padding: "4px 6px 6px" }}>
                {fincas.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    role="menuitem"
                    onClick={() => { onFincaChange(f.id); setOpen(false); }}
                    style={{ width: "100%", display: "flex", alignItems: "center", gap: 11, padding: "10px", border: "none", background: f.id === activeFincaId ? "var(--green-050)" : "transparent", borderRadius: 10, cursor: "pointer", marginBottom: 1 }}
                    onMouseEnter={(e) => { if (f.id !== activeFincaId) e.currentTarget.style.background = "var(--cream-tert)"; }}
                    onMouseLeave={(e) => { if (f.id !== activeFincaId) e.currentTarget.style.background = "transparent"; }}
                  >
                    <FincaMark name={f.nombre} />
                    <span style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
                      <span style={{ display: "block", fontSize: 14, fontWeight: 600, color: "var(--fg-1)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{f.nombre}</span>
                      <span style={{ display: "block", fontSize: 12, color: "var(--fg-3)", marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{f.role} · {f.location}</span>
                    </span>
                    {f.pend > 0 && (
                      <span style={{ minWidth: 20, height: 20, padding: "0 6px", borderRadius: 999, background: "var(--brown-700)", color: "#fff", fontSize: 11.5, fontWeight: 700, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>{f.pend}</span>
                    )}
                    <ArrowRight size={16} color="var(--fg-3)" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Navegación del panel */}
        <nav style={{ display: "flex", alignItems: "center", gap: 2, flex: 1, minWidth: 0, overflow: "hidden" }} className="panel-nav">
          {NAV.map((item) => {
            const on = item.id === active;
            const style: React.CSSProperties = {
              padding: "8px 12px", borderRadius: "var(--radius)", fontSize: 14, fontWeight: on ? 600 : 500,
              color: item.soon ? "var(--fg-3)" : on ? "var(--green-800)" : "var(--fg-2)",
              background: on ? "var(--green-050)" : "transparent", textDecoration: "none",
              display: "inline-flex", alignItems: "center", gap: 6, whiteSpace: "nowrap",
            };
            if (item.soon) {
              return (
                <span key={item.id} style={{ ...style, cursor: "default" }} title="Próximamente">
                  {item.label}
                  <span style={{ fontSize: 9.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".04em", color: "var(--brown-700)", background: "var(--brown-100)", borderRadius: 999, padding: "1px 6px" }}>pronto</span>
                </span>
              );
            }
            return <Link key={item.id} href={item.href!} style={style}>{item.label}</Link>;
          })}
        </nav>

        <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
          <Link href={`/establecimientos/EST-ESCONDIDA`} className="btn btn-neutral btn-sm panel-perfil" style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
            <ExternalLink size={15} /> Ver perfil público
          </Link>
          <button type="button" aria-label="Notificaciones" style={{ width: 38, height: 38, borderRadius: "var(--radius)", border: "1px solid var(--outline-variant)", background: "var(--surface)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Bell size={18} color="var(--fg-2)" />
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }} className="panel-user">
            <div style={{ textAlign: "right", lineHeight: 1.2 }}>
              <div style={{ fontSize: 12.5, color: "var(--fg-3)" }}>Productora</div>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--fg-1)" }}>Lucía Funes</div>
            </div>
            <div style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--green-800)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600, fontSize: 14 }}>LF</div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 1080px) { .panel-nav { display: none !important; } }
        @media (max-width: 720px) { .panel-perfil, .panel-user, .finca-meta { display: none !important; } }
      `}</style>
    </header>
  );
}
