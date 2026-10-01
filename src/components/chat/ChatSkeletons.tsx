import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";

/*
 * Esqueletos de los chats, compartidos por el drawer del visitante y la bandeja
 * del productor. Miden como las filas y las burbujas que reemplazan, para que
 * nada salte cuando llegan los datos.
 */

/** Anchos fijos y no aleatorios: igual en el server y en el cliente. */
const ANCHOS_TITULO = ["w-2/5", "w-1/2", "w-1/3", "w-[45%]", "w-2/5"];
const ANCHOS_MENSAJE = ["w-4/5", "w-3/5", "w-[70%]", "w-1/2", "w-3/4"];

interface SkeletonFilasChatProps {
  filas?: number;
  /** Forma del avatar: el establecimiento es un cuadrado redondeado; el visitante, un círculo. */
  avatar: "cuadrado" | "circulo";
  /** Línea extra con la actividad, como en la bandeja del productor. */
  conActividad?: boolean;
  /** Padding de la fila, que cambia entre pantallas. */
  className?: string;
}

export function SkeletonFilasChat({ filas = 5, avatar, conActividad, className }: SkeletonFilasChatProps) {
  return (
    <div role="status" aria-label="Cargando chats">
      {Array.from({ length: filas }, (_, i) => (
        <div key={i} className={cn("flex items-start gap-3 border-b border-cream-tert", className)}>
          <Skeleton className={cn("size-11 shrink-0", avatar === "circulo" ? "rounded-full" : "rounded-[10px]")} />
          <div className="min-w-0 flex-1 pt-0.5">
            <div className="flex items-center justify-between gap-2">
              <Skeleton className={cn("h-3.5", ANCHOS_TITULO[i % ANCHOS_TITULO.length])} />
              <Skeleton className="h-3 w-9" />
            </div>
            {conActividad && <Skeleton className="mt-2 h-3 w-1/3" />}
            <Skeleton className={cn("mt-2.5 h-3", ANCHOS_MENSAJE[i % ANCHOS_MENSAJE.length])} />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Lado y ancho de cada burbuja: alterna como una conversación de verdad. */
const BURBUJAS: { mine: boolean; ancho: string; alto: string }[] = [
  { mine: false, ancho: "w-[62%]", alto: "h-14" },
  { mine: true, ancho: "w-[48%]", alto: "h-10" },
  { mine: false, ancho: "w-[38%]", alto: "h-10" },
  { mine: true, ancho: "w-[66%]", alto: "h-14" },
  { mine: false, ancho: "w-[52%]", alto: "h-10" },
];

export function SkeletonMensajes() {
  return (
    <div role="status" aria-label="Cargando mensajes" className="mt-auto flex flex-col gap-2">
      <Skeleton className="mx-auto mt-2 mb-1 h-5 w-16 rounded-pill" />
      {BURBUJAS.map((b, i) => (
        <div key={i} className={cn("flex flex-col gap-1", b.ancho, b.mine ? "items-end self-end" : "items-start self-start")}>
          <Skeleton
            className={cn(
              "w-full",
              b.alto,
              b.mine ? "rounded-[16px_16px_4px_16px]" : "rounded-[16px_16px_16px_4px]",
            )}
          />
          <Skeleton className="h-2.5 w-8" />
        </div>
      ))}
    </div>
  );
}
