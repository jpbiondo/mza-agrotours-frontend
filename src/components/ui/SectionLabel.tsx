import type { HTMLAttributes } from "react";

/** Rótulo de sección en versalitas (reemplaza el const `sectionLbl` inline). */
export function SectionLabel({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`mb-4 text-[11px] font-bold uppercase tracking-[0.06em] text-brown-700 ${className}`}
      {...props}
    />
  );
}
