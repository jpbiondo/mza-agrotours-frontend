import type { ReactNode } from "react";
import PanelShell from "@/components/panel/PanelShell";
import GuardRol from "@/components/GuardRol";

/**
 * Chrome y protección de todo el panel del productor. El alta de
 * establecimiento vive en /mis-solicitudes, en el espacio de visitante: acá se
 * entra sólo con uno ya existente.
 *
 * El shell envuelve al guard, igual que en /admin: así el sidebar está desde la
 * primera pintura y sólo el área de contenido espera a que se verifique la
 * sesión.
 */
export default function PanelLayout({ children }: { children: ReactNode }) {
  return (
    <PanelShell>
      <GuardRol rol="productor">{children}</GuardRol>
    </PanelShell>
  );
}
