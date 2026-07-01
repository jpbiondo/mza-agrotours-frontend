"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Menu, X, LogIn, UserPlus } from "lucide-react";

interface NavLink { id: string; href: string; label: string }

export default function MobileNav({ links, active }: { links: NavLink[]; active?: string }) {
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (wrap.current && !wrap.current.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, [open]);

  return (
    <div ref={wrap} className="site-mobile" style={{ position: "relative", display: "none" }}>
      <button type="button" aria-label="Menú" aria-expanded={open} onClick={() => setOpen((o) => !o)} className="btn btn-neutral btn-sm" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "0 10px", height: 36, background: open ? "var(--cream-tert)" : undefined }}>
        {open ? <X size={18} /> : <Menu size={18} />}
      </button>

      {open && (
        <div className="pop" role="menu" style={{ position: "absolute", top: "calc(100% + 10px)", right: 0, width: 250, background: "var(--surface)", border: "1px solid var(--outline-variant)", borderRadius: 14, boxShadow: "var(--shadow-pop)", overflow: "hidden", zIndex: 60 }}>
          <div style={{ padding: 6 }}>
            {links.map(({ id, href, label }) => {
              const on = id === active;
              return (
                <Link key={id} href={href} role="menuitem" onClick={() => setOpen(false)} style={{ display: "flex", alignItems: "center", padding: "11px 12px", borderRadius: 10, textDecoration: "none", fontSize: 15, fontWeight: on ? 600 : 500, color: on ? "var(--green-800)" : "var(--fg-1)", background: on ? "var(--green-050)" : "transparent" }}>
                  {label}
                </Link>
              );
            })}
          </div>
          <div style={{ height: 1, background: "var(--outline-variant)", margin: "2px 6px 6px" }} />
          <div style={{ padding: "0 8px 10px", display: "flex", flexDirection: "column", gap: 8 }}>
            <Link href="/acceso" onClick={() => setOpen(false)} className="btn btn-neutral" style={{ textDecoration: "none", width: "100%", justifyContent: "center" }}><LogIn size={18} /> Iniciar sesión</Link>
            <Link href="/registro?vista=registro" onClick={() => setOpen(false)} className="btn btn-primary" style={{ textDecoration: "none", width: "100%", justifyContent: "center" }}><UserPlus size={18} /> Registrarse</Link>
          </div>
        </div>
      )}
    </div>
  );
}
