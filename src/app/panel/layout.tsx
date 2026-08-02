import type { ReactNode } from "react";
import GuardRol from "@/components/GuardRol";

/**
 * El panel es sólo para productores: dar de alta un establecimiento vive en
 * /mis-solicitudes, en el espacio de visitante. Va en el layout y no en cada
 * pantalla para que una página nueva bajo /panel quede protegida sola.
 */
export default function PanelLayout({ children }: { children: ReactNode }) {
  return <GuardRol rol="productor">{children}</GuardRol>;
}
