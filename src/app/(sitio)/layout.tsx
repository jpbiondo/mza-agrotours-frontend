import type { ReactNode } from "react";
import SiteHeader from "@/components/SiteHeader";

/**
 * Chrome del sitio público y del espacio de visitante. El grupo `(sitio)` no
 * aporta segmento a la URL: sirve sólo para colgar este layout de las rutas que
 * comparten la navbar, en vez de repetirla en cada página como estaba antes.
 *
 * Quedan afuera a propósito: `/` (el landing pasa sus propias anclas de sección
 * y otro ancho), `/acceso` (no lleva navbar), y `/admin` y `/panel`, que tienen
 * su propio chrome.
 */
export default function SitioLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <SiteHeader />
      {children}
    </>
  );
}
