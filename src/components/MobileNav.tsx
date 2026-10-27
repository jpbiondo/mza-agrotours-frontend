"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { IconButton } from "@/components/ui";
import { Sheet, SheetBody, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

interface NavLink { id: string; href: string; label: string }

/**
 * Menú de la navbar para anchos chicos: burger a la izquierda del logo y cajón
 * que entra por la izquierda, como el del shell del panel. Se esconde a partir
 * del corte `nav:`, que es donde <SiteHeader> muestra los links en línea.
 */
export default function MobileNav({ links, active }: { links: NavLink[]; active?: string }) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <IconButton
        onClick={() => setOpen(true)}
        aria-label="Abrir menú"
        aria-expanded={open}
        className="nav:hidden"
      >
        <Menu />
      </IconButton>

      <SheetContent side="left" className="nav:hidden">
        <SheetHeader className="border-b-0 pl-5">
          <SheetTitle className="flex items-center gap-2.5">
            <Image src="/logo-pano.svg" width={45} height={30} alt="" />
            <span className="leading-none">
              <span className="block font-display text-[17px] font-bold text-green-800">Mendoza</span>
              <span className="mt-[3px] block font-sans text-[9.5px] font-semibold tracking-[.12em] text-brown-700 uppercase">
                AgroTours
              </span>
            </span>
          </SheetTitle>
        </SheetHeader>

        <div className="mx-4 h-px bg-outline-variant" />

        {/* Al elegir una sección el cajón se cierra solo. */}
        <SheetBody>
          <nav className="flex flex-col gap-0.5 p-3">
            {links.map(({ id, href, label }) => (
              <Link
                key={id}
                href={href}
                onClick={() => setOpen(false)}
                aria-current={id === active ? "page" : undefined}
                className={cn(
                  "flex items-center rounded-[10px] px-3 py-[11px] text-[15px] no-underline",
                  id === active
                    ? "bg-green-050 font-semibold text-green-800"
                    : "font-medium text-fg-1 hover:bg-cream-tert",
                )}
              >
                {label}
              </Link>
            ))}
          </nav>
        </SheetBody>
      </SheetContent>
    </Sheet>
  );
}
