"use client";

import { Cargando, PantallaDeFalla, useDetalleEnConsola } from "@/components/AsyncView";
import { clasificarError } from "@/lib/errores";

interface AsyncBoundaryProps {
  loading: boolean;
  error: string | null;
  onRetry?: () => void;
  loadingLabel?: string;
  /**
   * Reemplaza el spinner mientras carga. Para pantallas con una forma conocida
   * —una tabla, unas métricas— un esqueleto con esa forma evita que el
   * contenido salte de lugar cuando llegan los datos.
   */
  skeleton?: React.ReactNode;
  /** Aire vertical del spinner, en px (más grande en páginas enteras). */
  pad?: number;
  children: React.ReactNode;
}

/**
 * Estado compartido de carga / error para las lecturas asíncronas.
 * Muestra spinner (o el esqueleto que le pasen) mientras carga, la pantalla de
 * error que corresponda (`ErrorScreen`, `ForbiddenScreen` ante un 403,
 * `NotFoundScreen` ante un 404), o el contenido cuando hay datos.
 *
 * El mensaje técnico del error ya no se pinta: se traduce con
 * `clasificarError` y el detalle va a la consola. Un string que el hook
 * redactó para el usuario se sigue mostrando.
 *
 * @deprecated Para pantallas nuevas, `<AsyncView>`: además resuelve el vacío y
 * el "no encontrado". Éste queda para los usos existentes.
 */
export default function AsyncBoundary({ loading, error, onRetry, loadingLabel, skeleton, pad = 120, children }: AsyncBoundaryProps) {
  const falla = loading ? null : clasificarError(error);
  useDetalleEnConsola(falla);

  if (loading) {
    if (skeleton) return <>{skeleton}</>;
    return <Cargando label={loadingLabel} pad={pad >= 110 ? "lg" : pad >= 60 ? "md" : "sm"} />;
  }

  if (falla) return <PantallaDeFalla falla={falla} onRetry={onRetry} />;

  return <>{children}</>;
}
