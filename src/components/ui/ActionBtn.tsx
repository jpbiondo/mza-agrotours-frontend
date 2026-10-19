import type { ReactNode } from "react";
import { Loader } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Botón de acción de una fila de tabla o de una tarjeta de listado: ícono +
 * texto, de contorno y sin la sombra táctil de <Button>. Es lo que pide el
 * diseño para las acciones secundarias de un listado: tres botones con relieve
 * por fila pesarían más que el contenido de la tabla, y con la sombra se leen
 * más altos de lo que son.
 *
 * El motivo de un botón apagado va en `title` y, según la guía, además en una
 * leyenda única arriba de la tabla: repetirlo debajo de cada fila no entra.
 */
export function ActionBtn({
  icon,
  label,
  tone = "neutral",
  disabled,
  loading = false,
  title,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  tone?: "neutral" | "danger";
  disabled?: boolean;
  /** Acción en curso: el spinner reemplaza al ícono y el botón queda apagado. */
  loading?: boolean;
  /** Siempre: cuando está deshabilitado, es el único lugar de la fila donde se explica por qué. */
  title: string;
  onClick?: () => void;
}) {
  const apagado = disabled || loading;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={apagado}
      aria-busy={loading || undefined}
      title={title}
      className={cn(
        "inline-flex items-center gap-2 rounded-md border bg-surface px-3 py-2 font-sans text-sm font-semibold whitespace-nowrap transition-colors",
        apagado
          ? "cursor-not-allowed border-outline-variant bg-cream-tert text-fg-3"
          : tone === "danger"
            ? "cursor-pointer border-danger text-danger hover:bg-danger-fill"
            : "cursor-pointer border-sand text-green-800 hover:bg-green-050",
      )}
    >
      {loading ? <Loader aria-hidden className="spin size-4 shrink-0" /> : icon} {label}
    </button>
  );
}
