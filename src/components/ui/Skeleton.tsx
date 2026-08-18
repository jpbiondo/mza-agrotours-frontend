import { cn } from "@/lib/utils";

/**
 * Bloque que ocupa el lugar del contenido mientras carga. El tamaño lo pone
 * quien lo usa: la gracia del esqueleto es que mida parecido a lo que va a
 * reemplazar, para que nada salte cuando llegan los datos.
 *
 * `aria-hidden` porque no dice nada: el estado de carga se anuncia una sola vez
 * en el contenedor, no una por barra.
 */
export function Skeleton({ className = "" }: { className?: string }) {
  return <div aria-hidden className={cn("animate-pulse rounded-md bg-cream-tert", className)} />;
}
