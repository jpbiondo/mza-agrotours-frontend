"use client";

import { useEffect } from "react";
import { ErrorScreen } from "@/components/ui/StatusScreen";
import { clasificarError } from "@/lib/errores";

/**
 * Error de render no capturado. Muestra el mismo panel que una lectura fallida;
 * "Reintentar" vuelve a renderizar el segmento (`reset`). El detalle va a la
 * consola, nunca a la pantalla.
 */
export default function ErrorPagina({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  // Un error de render casi nunca tiene un mensaje para el usuario: sin
  // clasificación clara, va el genérico de servidor.
  const falla = clasificarError(error);
  return (
    <ErrorScreen
      falla={falla && falla.tipo !== "dominio" ? falla : null}
      onRetry={reset}
      framed
    />
  );
}
