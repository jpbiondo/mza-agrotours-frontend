import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Botón de acción de una fila de tabla: ícono + texto, de contorno y sin la
 * sombra táctil de <Button>. Es lo que pide el diseño para las acciones
 * secundarias de un listado: tres botones con relieve por fila pesarían más que
 * el contenido de la tabla, y con la sombra se leen más altos de lo que son.
 */
export function ActionBtn({
  icon,
  label,
  tone = "neutral",
  disabled,
  title,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  tone?: "neutral" | "danger";
  disabled?: boolean;
  /** Siempre: cuando está deshabilitado, es el único lugar donde se explica por qué. */
  title: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        "inline-flex items-center gap-2 rounded-md border bg-surface px-3 py-2 font-sans text-sm font-semibold whitespace-nowrap transition-colors",
        disabled
          ? "cursor-not-allowed border-outline-variant bg-cream-tert text-fg-3"
          : tone === "danger"
            ? "cursor-pointer border-danger text-danger hover:bg-danger-fill"
            : "cursor-pointer border-sand text-green-800 hover:bg-green-050",
      )}
    >
      {icon} {label}
    </button>
  );
}
