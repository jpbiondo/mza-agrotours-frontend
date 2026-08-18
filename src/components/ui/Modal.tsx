import type { ReactNode } from "react";

/**
 * Diálogo modal centrado con scrim. `onClose` se dispara al hacer click fuera de
 * la caja; pasá `dismissable={false}` para estados no cancelables (p. ej. mientras
 * se procesa una acción).
 */
export function Modal({
  onClose,
  dismissable = true,
  padding = "p-[28px_28px_24px]",
  className = "",
  children,
}: {
  onClose?: () => void;
  dismissable?: boolean;
  /** Utilidad(es) de padding de la caja. Se pasa aparte de `className` para no
   *  competir con el padding por defecto (dos utilidades `p-*` no tienen orden garantizado). */
  padding?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      onMouseDown={dismissable ? onClose : undefined}
      className="fixed inset-0 z-[140] flex items-center justify-center bg-[rgba(42,38,32,0.48)] p-6 backdrop-blur-[2px]"
    >
      <div
        onMouseDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        className={`pop relative w-[468px] max-w-full rounded-lg border border-outline-variant bg-surface shadow-pop ${padding} ${className}`}
      >
        {children}
      </div>
    </div>
  );
}
