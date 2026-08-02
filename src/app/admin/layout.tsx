import type { ReactNode } from "react";
import GuardRol from "@/components/GuardRol";

/**
 * Toda la administración exige el rol admin. Va en el layout y no en cada
 * pantalla para que una página nueva bajo /admin quede protegida sola.
 */
export default function AdminLayout({ children }: { children: ReactNode }) {
  return <GuardRol rol="admin">{children}</GuardRol>;
}
