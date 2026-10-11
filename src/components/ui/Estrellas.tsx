import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Puntaje de 0 a 5 como estrellas llenas y vacías, sólo para leer. Para elegir
 * un puntaje está `<StarRating>` en `star-rating.tsx`. Redondea al entero: un
 * 4,6 se ve como cinco, que es como lo dibuja el diseño.
 */
export function Estrellas({ valor, size = 14, className }: { valor: number; size?: number; className?: string }) {
  const llenas = Math.round(valor);
  return (
    <span
      role="img"
      aria-label={`${valor.toLocaleString("es-AR", { maximumFractionDigits: 1 })} de 5 estrellas`}
      className={cn("inline-flex items-center gap-0.5", className)}
    >
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={size}
          aria-hidden
          className={i <= llenas ? "fill-star text-star" : "fill-outline-variant text-outline-variant"}
        />
      ))}
    </span>
  );
}
