"use client";

import { Skeleton } from "@/components/ui";
import { useComisionSistema } from "@/hooks/useComisionSistema";

/**
 * El porcentaje vigente de la comisión, en línea dentro de una frase: "una
 * comisión {del 5%}". Mientras carga, un esqueleto del ancho del número. Si no
 * se pudo leer, `sinDato` ("porcentual", "de la plataforma"…): la frase tiene
 * que leerse bien igual, y es preferible no dar un número a dar uno viejo.
 */
export function ComisionSistema({ prefijo = "", sinDato }: { prefijo?: string; sinDato: string }) {
  const { porcentaje, isLoading } = useComisionSistema();
  if (isLoading) return <Skeleton inline className="h-[1em] w-[4ch]" />;
  if (porcentaje === null) return <>{sinDato}</>;
  return <>{`${prefijo}${porcentaje.toLocaleString("es-AR")}%`}</>;
}
