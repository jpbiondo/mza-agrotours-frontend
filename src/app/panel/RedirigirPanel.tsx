"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useEstablecimientoPorDefecto } from "@/hooks/useEstablecimientos";
import { rutaPanel } from "@/lib/rutasPanel";
import EmptyEstablecimiento from "./EmptyEstablecimiento";

/**
 * `/panel` a secas no muestra nada propio: lleva al último establecimiento que
 * se miró, o al primero. Es a donde apuntan los links de afuera del panel, que
 * no saben de establecimientos. Sin ninguno, el prompt de alta.
 */
export default function RedirigirPanel() {
  const router = useRouter();
  const { destino, listo } = useEstablecimientoPorDefecto();

  useEffect(() => {
    // `replace`: si no, "atrás" volvería a `/panel` y de ahí otra vez acá.
    if (listo && destino) router.replace(rutaPanel(destino.id));
  }, [listo, destino, router]);

  if (listo && !destino) return <EmptyEstablecimiento />;
  return null;
}
