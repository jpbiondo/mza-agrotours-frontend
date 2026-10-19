import Link from "next/link";
import type { MouseEventHandler, ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

const CLASES =
  "inline-flex cursor-pointer items-center gap-1.5 border-0 bg-transparent p-0 text-sm font-semibold text-green-800 no-underline hover:underline underline-offset-2";

/**
 * "Volver" a la pantalla anterior: texto verde con flecha, arriba del título.
 *
 * Con `href` es un link común. Con `onClick` (sin `href`) es un botón, para
 * cuando la salida tiene que pasar por una confirmación (`useAvisoSalida`).
 */
export function BackLink({
  href,
  onClick,
  className,
  children = "Volver",
}: {
  href?: string;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  className?: string;
  children?: ReactNode;
}) {
  const contenido = (
    <>
      <ArrowLeft aria-hidden className="size-4" /> {children}
    </>
  );
  if (href) {
    return (
      <Link href={href} className={cn(CLASES, className)}>
        {contenido}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} className={cn(CLASES, className)}>
      {contenido}
    </button>
  );
}
