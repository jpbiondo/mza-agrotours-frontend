"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useSesionRequerida } from "@/hooks/useSesionRequerida";
import { rutaAcceso, rutaActual } from "@/lib/volver";

/**
 * Pantalla de visitante que exige sesión pero no un rol (mis reservas, mis
 * solicitudes, cuenta, reservar). Sin sesión, redirige a `/acceso?volver=…`.
 *
 * Mientras Firebase resuelve la sesión no dibuja nada, igual que `<GuardRol>`:
 * dura un instante, y un cartel que aparece y desaparece se lee como demora.
 *
 * Para `/admin` y `/panel`, `<GuardRol>` (que además chequea el rol). Un 401 del
 * backend con la sesión vencida no pasa por acá: lo resuelve `conToken`.
 */
export default function GuardSesion({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { checking, unauthenticated } = useSesionRequerida();

  useEffect(() => {
    if (unauthenticated) router.replace(rutaAcceso({ volver: rutaActual() }));
  }, [unauthenticated, router]);

  if (checking || unauthenticated) return null;
  return <>{children}</>;
}
