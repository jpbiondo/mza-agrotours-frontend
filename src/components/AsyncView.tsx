"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";
import { Loader } from "lucide-react";
import { ErrorScreen, ForbiddenScreen, NotFoundScreen } from "@/components/ui/StatusScreen";
import { clasificarError, type Falla } from "@/lib/errores";
import { cn } from "@/lib/utils";

/**
 * El estado de una lectura, tal como lo devuelven `useAsync`,
 * `useLecturaConToken` y la mayoría de los hooks `use*` del proyecto.
 */
export interface QueryState<T> {
  isLoading: boolean;
  /** Un `ApiError`, un `Error` o el string que guarda el hook. */
  error: unknown;
  data?: T | null;
  reload?: () => void;
}

export interface AsyncViewProps<T> {
  query: QueryState<T>;
  /** Esqueleto con la forma del contenido. Sin él, spinner centrado (sólo si la forma no es predecible). */
  skeleton?: ReactNode;
  loadingLabel?: string;
  /** Cuándo los datos cuentan como vacíos. Sin esto no hay estado vacío. */
  isEmpty?: (data: T) => boolean;
  /** El `<EmptyState>` a mostrar cuando `isEmpty` da true. */
  empty?: ReactNode;
  /**
   * Qué mostrar si la lectura terminó sin datos (`data === null`) o con 404.
   * Los hooks del proyecto devuelven `null` para un id inexistente.
   * Por defecto, `<NotFoundScreen>` genérico.
   */
  notFound?: ReactNode;
  /** Reemplaza al `<ForbiddenScreen>` por defecto ante un 403. */
  forbidden?: ReactNode;
  children: (data: T) => ReactNode;
}

/**
 * Único punto de entrada para pintar una lectura: elige entre carga, error
 * (red, servidor, sesión, permiso, no encontrado), vacío y contenido.
 *
 * ```tsx
 * <AsyncView
 *   query={useRecetas()}
 *   skeleton={<Skeleton layout="cards" />}
 *   isEmpty={(d) => d.length === 0}
 *   empty={<EmptyState title="Todavía no hay recetas" />}
 * >
 *   {(recetas) => <Grilla recetas={recetas} />}
 * </AsyncView>
 * ```
 *
 * Nunca muestra el mensaje técnico del error: lo traduce con `clasificarError`
 * y lo deja en la consola.
 */
export function AsyncView<T>({
  query,
  skeleton,
  loadingLabel,
  isEmpty,
  empty,
  notFound,
  forbidden,
  children,
}: AsyncViewProps<T>) {
  const falla = query.isLoading ? null : clasificarError(query.error);
  useDetalleEnConsola(falla);

  if (query.isLoading) return <>{skeleton ?? <Cargando label={loadingLabel} />}</>;

  if (falla) return <PantallaDeFalla falla={falla} onRetry={query.reload} notFound={notFound} forbidden={forbidden} />;

  if (query.data === null || query.data === undefined) return <>{notFound ?? <NotFoundScreen />}</>;
  if (isEmpty?.(query.data)) return <>{empty ?? null}</>;
  return <>{children(query.data)}</>;
}

/** La pantalla que corresponde a cada tipo de falla. Compartida con `<AsyncBoundary>`. */
export function PantallaDeFalla({
  falla,
  onRetry,
  notFound,
  forbidden,
}: {
  falla: Falla;
  onRetry?: () => void;
  notFound?: ReactNode;
  forbidden?: ReactNode;
}) {
  if (falla.tipo === "permiso") {
    return <>{forbidden ?? <ForbiddenScreen motivo={falla.mensaje} />}</>;
  }
  if (falla.tipo === "noEncontrado") return <>{notFound ?? <NotFoundScreen />}</>;
  return <ErrorScreen falla={falla} onRetry={onRetry} />;
}

/** Spinner centrado de carga. `pad` es el aire vertical: más grande en páginas enteras. */
export function Cargando({ label = "Cargando…", pad = "lg" }: { label?: string; pad?: "sm" | "md" | "lg" }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn("px-7 text-center text-fg-3", pad === "lg" ? "py-30" : pad === "md" ? "py-18" : "py-12")}
    >
      <Loader aria-hidden className="spin mx-auto size-6.5" />
      <div className="mt-3 text-sm">{label}</div>
    </div>
  );
}

/** El detalle técnico de una falla va a la consola, una vez por falla. */
export function useDetalleEnConsola(falla: Falla | null) {
  const detalle = falla?.detalle;
  useEffect(() => {
    if (detalle) console.warn("[lectura]", detalle);
  }, [detalle]);
}
