import type { ReactNode } from "react";
import AdminShell from "@/components/admin/AdminShell";
import GuardRol from "@/components/GuardRol";

/**
 * Chrome y protección de toda la administración. Van en el layout y no en cada
 * pantalla para que una página nueva bajo /admin quede protegida y enmarcada
 * sola.
 *
 * El shell envuelve al guard a propósito: mientras se verifica la sesión ya
 * está el sidebar de administración en pantalla y sólo el área de contenido
 * muestra el estado de carga. Al revés —guard afuera— la primera pintura era
 * el chrome del sitio público y después saltaba a éste.
 */
export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AdminShell>
      <GuardRol rol="admin">{children}</GuardRol>
    </AdminShell>
  );
}
