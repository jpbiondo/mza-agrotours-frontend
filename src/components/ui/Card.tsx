import type { HTMLAttributes } from "react";

/** Superficie base (fondo, borde, radio). El padding lo pone quien la usa. */
export function Card({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-lg border border-outline-variant bg-surface ${className}`}
      {...props}
    />
  );
}
