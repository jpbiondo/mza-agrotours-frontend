import type { ReactNode } from "react";
import { Inbox, RotateCcw, SearchX } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

/**
 * Estado vacío. Cuándo va cada variante (ver docs/ui-guidelines.md):
 *
 * - `kind="empty"`: todavía no hay datos. Si el usuario puede crear, va el CTA
 *   en `action` (un `<Button>` primary).
 * - `kind="no-results"`: hay datos pero el filtro o la búsqueda no devuelve
 *   nada. Siempre ofrece "Limpiar filtros" con `onClear`.
 * - `size="inline"`: una sección vacía dentro de un detalle. Una línea de
 *   texto, sin ícono ni acción.
 *
 * En una tabla vacía, va en lugar de la tabla, nunca como fila.
 */
export function EmptyState({
  kind = "empty",
  size = "block",
  icon,
  title,
  children,
  action,
  onClear,
  clearLabel = "Limpiar filtros",
  className,
}: {
  kind?: "empty" | "no-results";
  size?: "block" | "inline";
  /** Ícono lucide. Por defecto, `Inbox` (sin datos) o `SearchX` (sin resultados). */
  icon?: ReactNode;
  /** Obligatorio en `block`. En `inline` se ignora: el texto va en `children`. */
  title?: string;
  /** Texto de apoyo: qué significa y qué puede hacer el usuario. */
  children?: ReactNode;
  /** CTA de `kind="empty"`. */
  action?: ReactNode;
  /** Limpia filtros y búsqueda en `kind="no-results"`. */
  onClear?: () => void;
  clearLabel?: string;
  className?: string;
}) {
  if (size === "inline") {
    return (
      <div className={cn("rounded-lg border border-dashed border-sand bg-surface px-6 py-9 text-center text-[14.5px] text-fg-2", className)}>
        {children}
      </div>
    );
  }

  const sinResultados = kind === "no-results";
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-3 rounded-lg border border-dashed border-sand bg-surface px-6 py-16 text-center",
        className,
      )}
    >
      <div
        aria-hidden
        className={cn(
          "flex size-16 items-center justify-center rounded-full bg-cream-tert [&_svg]:size-7",
          sinResultados ? "text-fg-3" : "text-brown-700",
        )}
      >
        {icon ?? (sinResultados ? <SearchX /> : <Inbox />)}
      </div>
      <h2 className="m-0 font-display text-xl font-semibold text-fg-1">{title}</h2>
      {children && <div className="max-w-110 text-[14.5px] leading-normal text-fg-2">{children}</div>}
      {sinResultados && onClear && (
        <Button variant="neutral" className="mt-2" onClick={onClear}>
          <RotateCcw className="size-4" aria-hidden /> {clearLabel}
        </Button>
      )}
      {!sinResultados && action && <div className="mt-2">{action}</div>}
    </div>
  );
}
