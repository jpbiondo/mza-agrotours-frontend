import { Fragment } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import AsyncBoundary from "@/components/AsyncBoundary";
import { buttonClasses } from "@/components/ui";

/** Misma grilla que los catálogos: de 1 a 3 columnas según el ancho. */
const GRILLA = "grid grid-cols-1 gap-6 min-[681px]:grid-cols-2 min-[1041px]:grid-cols-3";

/** Tarjetas fantasma mientras carga: una fila, que es lo mínimo que puede llegar con datos. */
const FANTASMAS = 3;

interface DestacadosProps {
  etiqueta: string;
  titulo: string;
  bajada: string;
  /** Catálogo completo al que lleva "Ver todas". */
  href: string;
  verTodas: string;
  cargando: boolean;
  error: string | null;
  onRetry: () => void;
  /** Se muestra en lugar de la grilla cuando el backend no devolvió ninguno. */
  vacio: string;
  /** Cuántos llegaron: con 0 va el aviso de vacío. */
  cantidad: number;
  esqueleto: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Encabezado + grilla de una sección de destacados de la landing. Cuántos y
 * cuáles los decide el backend (de 0 a 6): la grilla se acomoda a lo que
 * llegue y, si no llega nada, la sección queda con un aviso en vez de
 * desaparecer, para no romper el ancla del nav.
 */
export default function Destacados({
  etiqueta, titulo, bajada, href, verTodas, cargando, error, onRetry, vacio, cantidad, esqueleto, children,
}: DestacadosProps) {
  return (
    <>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="t-label mb-2.5 text-brown-700">{etiqueta}</div>
          <h2 className="m-0 font-display text-[32px] font-bold tracking-[-.01em] text-fg-1">{titulo}</h2>
          <p className="mt-2.5 mb-0 max-w-[540px] text-base text-fg-2">{bajada}</p>
        </div>
        <Link href={href} className={buttonClasses({ variant: "neutral", className: "shrink-0" })}>
          {verTodas} <ArrowRight size={16} />
        </Link>
      </div>

      <AsyncBoundary
        loading={cargando}
        error={error}
        onRetry={onRetry}
        pad={48}
        skeleton={<div className={GRILLA}>{Array.from({ length: FANTASMAS }, (_, i) => <Fragment key={i}>{esqueleto}</Fragment>)}</div>}
      >
        {cantidad === 0 ? (
          <div className="rounded-lg border border-dashed border-sand bg-surface px-6 py-10 text-center text-[15px] text-fg-2">
            {vacio}
          </div>
        ) : (
          <div className={GRILLA}>{children}</div>
        )}
      </AsyncBoundary>
    </>
  );
}
