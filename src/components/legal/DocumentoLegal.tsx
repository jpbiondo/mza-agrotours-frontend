import type { ReactNode } from "react";
import { buttonClasses } from "@/components/ui";

/** Página de un documento legal: título, fecha de la versión, introducción y secciones. */
export function DocumentoLegal({
  titulo,
  actualizacion,
  intro,
  children,
}: {
  titulo: string;
  /** Fecha de la última versión, p. ej. "9 de noviembre de 2026". */
  actualizacion: string;
  intro: ReactNode;
  children: ReactNode;
}) {
  return (
    <article className="mx-auto max-w-190 px-7 pt-10 pb-24">
      <h1 className="m-0 font-display text-[38px] leading-[1.1] font-bold tracking-[-.015em] text-fg-1">{titulo}</h1>
      <p className="mt-3 mb-0 text-sm text-fg-3">Última actualización: {actualizacion}</p>
      <div className="mt-6 flex flex-col gap-3 text-base leading-[1.65] text-fg-2">{intro}</div>
      {children}
    </article>
  );
}

/** `id` para poder enlazar una sección desde otra pantalla (p. ej. `/terminos/productores#comisiones`). */
export function Seccion({ id, titulo, children }: { id?: string; titulo: string; children: ReactNode }) {
  return (
    <section id={id} className="mt-10 scroll-mt-24">
      <h2 className="m-0 font-display text-[22px] font-bold text-fg-1">{titulo}</h2>
      <div className="mt-3 flex flex-col gap-3 text-[15.5px] leading-[1.65] text-fg-2">{children}</div>
    </section>
  );
}

/** Link dentro del texto: la variante `text` de `Button`, con el tamaño del párrafo (como en `LoginCampos`). */
export const LINK_LEGAL = buttonClasses({ variant: "text", className: "text-[length:inherit]" });
