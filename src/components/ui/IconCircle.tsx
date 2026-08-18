import type { ReactNode } from "react";

type Tone = "danger" | "success" | "warning" | "info";

const fills: Record<Tone, string> = {
  danger: "bg-danger-fill",
  success: "bg-success-fill",
  warning: "bg-warning-fill",
  info: "bg-info-fill",
};

/** Círculo de 52px con un icono centrado (cabecera de modales). */
export function IconCircle({
  tone = "danger",
  className = "",
  children,
}: {
  tone?: Tone;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={`flex h-13 w-13 items-center justify-center rounded-full ${fills[tone]} ${className}`}
    >
      {children}
    </div>
  );
}
