import { Star } from "lucide-react";
import { fmtPuntaje } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * Puntaje promedio de una actividad sobre su foto: estrella, "4,8" y, si se
 * sabe, cuántas reseñas lo forman. Sólo para leer. Quien lo usa lo posiciona
 * por `className` y no lo muestra si no hay reseñas: un promedio sin reseñas
 * no es un puntaje.
 */
export function PuntajeBadge({ puntuacion, cantidad, className }: {
  puntuacion: number;
  cantidad?: number;
  className?: string;
}) {
  const texto = fmtPuntaje(puntuacion);
  const resenias = cantidad === undefined ? "" : `, ${cantidad} ${cantidad === 1 ? "reseña" : "reseñas"}`;
  return (
    <span
      role="img"
      aria-label={`${texto} de 5${resenias}`}
      className={cn(
        "inline-flex items-center gap-[5px] rounded-pill bg-[rgba(251,249,248,.95)] px-[11px] py-[5px] shadow-[0_2px_8px_rgba(45,90,39,.16)]",
        className,
      )}
    >
      <Star size={14} className="fill-star text-star" aria-hidden />
      <span aria-hidden className="font-mono text-[13.5px] font-bold text-fg-1">{texto}</span>
      {cantidad !== undefined && <span aria-hidden className="text-[11.5px] text-fg-3">({cantidad})</span>}
    </span>
  );
}
