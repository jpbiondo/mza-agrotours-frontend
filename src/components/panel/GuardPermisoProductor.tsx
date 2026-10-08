"use client";

import type { ReactNode } from "react";
import { SinPermiso } from "@/components/GuardRol";
import { useEstablecimientos } from "@/hooks/useEstablecimientos";
import { PermisoProductor, TipoPermiso } from "@/lib/permisos";
import { tienePermiso } from "@/lib/roles";
import { useAuthStore } from "@/stores/authStore";

/**
 * Muestra `<SinPermiso>` si el rol de la cuenta en el establecimiento de la URL
 * no incluye `permiso`. Los permisos de productor valen por establecimiento y
 * cuál está activo lo sabe recién el cliente, así que el chequeo no puede ir en
 * el layout: va en el `page.tsx` de cada pantalla, envolviendo al cliente.
 *
 * Se espera a `listo` antes de decidir: hasta que rehidrata la sesión no hay
 * accesos, y sin esperar se vería un instante el cartel a alguien que sí tiene
 * el permiso. Sin establecimiento activo deja pasar: esa pantalla dibuja su
 * propio aviso, y un id ajeno en la URL lo redirige `GuardEstablecimientoUrl`.
 *
 * Es control de navegación, no de seguridad —los accesos salen de un store que
 * se puede editar desde el navegador—: la barrera real es el backend.
 */
export default function GuardPermisoProductor({
  permiso, motivo, children,
}: {
  permiso: PermisoProductor;
  motivo: string;
  children: ReactNode;
}) {
  const { activo, listo } = useEstablecimientos();
  const accesos = useAuthStore((s) => s.accesos);

  if (!listo) return null;
  if (activo && !tienePermiso(accesos, permiso, { tipoPermiso: TipoPermiso.PRODUCTOR, establecimientoId: activo.id })) {
    return <SinPermiso motivo={motivo} />;
  }
  return <>{children}</>;
}

const SIN_GESTIONAR_ACTIVIDAD =
  "Tu rol en este establecimiento no incluye gestionar actividades. Pedíselo al Productor Líder de la finca.";

/** Las pantallas de actividades: el backend pide GESTIONAR_ACTIVIDAD en todas, lecturas incluidas. */
export function GuardGestionarActividad({ children }: { children: ReactNode }) {
  return (
    <GuardPermisoProductor permiso={PermisoProductor.GESTIONAR_ACTIVIDAD} motivo={SIN_GESTIONAR_ACTIVIDAD}>
      {children}
    </GuardPermisoProductor>
  );
}
