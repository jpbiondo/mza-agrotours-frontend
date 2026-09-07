"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useEstablecimientos } from "@/hooks/useEstablecimientos";

const LISTADO = "/panel/actividades";

/**
 * Cierra las pantallas que crean o modifican actividades mientras el
 * establecimiento activo esté suspendido, y manda al catálogo, que es donde el
 * cartel explica por qué.
 *
 * El backend rechaza el alta y la modificación con un 409 `E.suspendido`, así
 * que dejar entrar al formulario sólo llevaría a completarlo entero para
 * perderlo al guardar. Los links del catálogo ya vienen deshabilitados: esto
 * cubre la URL escrita a mano y el favorito viejo.
 *
 * Se espera a `listo` antes de decidir. Hasta que rehidratan los stores,
 * `activo` es el primero de la lista y no el que eligió el productor: redirigir
 * con esa lectura sacaría de la pantalla a quien está parado en otra finca.
 *
 * Es control de navegación, no de seguridad —los accesos salen de un store que
 * se puede editar desde el navegador—: la barrera real es el backend.
 */
export default function GuardEstablecimientoSuspendido({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { activo, listo } = useEstablecimientos();
  const bloqueado = listo && !!activo?.establecimientoSuspendido;

  useEffect(() => {
    if (bloqueado) router.replace(LISTADO);
  }, [bloqueado, router]);

  if (!listo || bloqueado) return null;

  return <>{children}</>;
}
