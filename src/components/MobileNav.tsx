"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavLink { id: string; href: string; label: string }

/**
 * Menú de la navbar para anchos chicos. Se esconde a partir del corte `nav:`,
 * que es donde <SiteHeader> muestra los links en línea. Antes la visibilidad la
 * decidía un `display: block !important` desde un <style> del header.
 */
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
    <div ref={wrap} className="relative nav:hidden">
      <button
        type="button"
        aria-label="Menú"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "inline-flex size-[38px] cursor-pointer items-center justify-center rounded-md border border-outline-variant",
          open ? "bg-cream-tert" : "bg-surface",
        )}
      >
        {open ? <X className="size-[18px] text-fg-2" /> : <Menu className="size-[18px] text-fg-2" />}
      </button>

      {open && (
        <div
          role="menu"
          className="pop absolute top-[calc(100%+10px)] right-0 z-[60] w-[250px] overflow-hidden rounded-[14px] border border-outline-variant bg-surface p-1.5 shadow-pop"
        >
          {links.map(({ id, href, label }) => (
            <Link
              key={id}
              href={href}
              role="menuitem"
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center rounded-[10px] px-3 py-[11px] text-[15px] no-underline",
                id === active
                  ? "bg-green-050 font-semibold text-green-800"
                  : "font-medium text-fg-1",
              )}
            >
              {label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
