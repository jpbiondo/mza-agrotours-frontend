"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

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
      <button type="button" aria-label="Menú" aria-expanded={open} onClick={() => setOpen((o) => !o)} style={{ width: 38, height: 38, borderRadius: "var(--radius)", border: "1px solid var(--outline-variant)", background: open ? "var(--cream-tert)" : "var(--surface)", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
        {open ? <X size={18} color="var(--fg-2)" /> : <Menu size={18} color="var(--fg-2)" />}
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
        </div>
      )}
    </div>
  );
}
