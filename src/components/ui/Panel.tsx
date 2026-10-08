"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Diálogo ancho, anclado arriba y con scroll propio. Complementa a <Modal>, que
 * es un diálogo centrado de ancho fijo: acá el contenido es un formulario que
 * puede pasar el alto de la ventana.
 *
 * Con `lado="derecha"` es un cajón lateral de alto completo: el contenido tiene
 * que manejar su propio scroll (cabecera y pie fijos, cuerpo con `overflow-y-auto`).
 */
export function Panel({
  onClose,
  /** Utilidad de ancho; se pasa aparte para no competir con la del panel. */
  width = "w-[720px]",
  lado = "centro",
  children,
}: {
  onClose: () => void;
  width?: string;
  lado?: "centro" | "derecha";
  children: ReactNode;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const derecha = lado === "derecha";
  return (
    <div
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className={cn(
        "fixed inset-0 z-[140] flex bg-[rgba(42,38,32,0.45)] backdrop-blur-[2px]",
        derecha ? "items-stretch justify-end" : "items-start justify-center overflow-y-auto px-5 py-10",
      )}
    >
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          "max-w-full overflow-hidden border-outline-variant bg-surface shadow-pop",
          derecha ? "slide flex h-dvh flex-col border-l" : "pop m-auto rounded-lg border",
          width,
        )}
      >
        {children}
      </div>
    </div>
  );
}
