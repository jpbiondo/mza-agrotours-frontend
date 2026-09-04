"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";

/**
 * Diálogo ancho, anclado arriba y con scroll propio. Complementa a <Modal>, que
 * es un diálogo centrado de ancho fijo: acá el contenido es un formulario que
 * puede pasar el alto de la ventana.
 */
export function Panel({
  onClose,
  /** Utilidad de ancho; se pasa aparte para no competir con la del panel. */
  width = "w-[720px]",
  children,
}: {
  onClose: () => void;
  width?: string;
  children: ReactNode;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-[140] flex items-start justify-center overflow-y-auto bg-[rgba(42,38,32,0.45)] px-5 py-10 backdrop-blur-[2px]"
    >
      <div
        className={`pop m-auto max-w-full overflow-hidden rounded-lg border border-outline-variant bg-surface shadow-pop ${width}`}
      >
        {children}
      </div>
    </div>
  );
}
