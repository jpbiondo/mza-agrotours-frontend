"use client";

import { Fragment, useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import AsyncBoundary from "@/components/AsyncBoundary";
import { EmptyState, IconButton, buttonClasses } from "@/components/ui";
import { cn } from "@/lib/utils";

/**
 * Fila deslizable: 3 tarjetas por vista en escritorio, 2 en tablet y en
 * celular una con la siguiente asomándose, para que se note que hay más. Las
 * tarjetas encajan de a una al soltar (scroll-snap).
 *
 * El padding con margen negativo deja lugar para la sombra y el levantado del
 * hover, que el `overflow` recortaría; el `scroll-px` hace que el encaje
 * respete ese padding.
 *
 * La barra de scroll se oculta sólo donde hay flechas: en una ventana angosta
 * con mouse es la única forma de desplazarse.
 */
const FILA =
  "-mx-1 -mt-1 -mb-3 flex snap-x snap-mandatory scroll-px-1 gap-6 overflow-x-auto px-1 pt-1 pb-3 min-[681px]:[scrollbar-width:none] min-[681px]:[&::-webkit-scrollbar]:hidden " +
  "[&>*]:shrink-0 [&>*]:snap-start [&>*]:basis-[85%] min-[681px]:[&>*]:basis-[calc((100%-24px)/2)] min-[1041px]:[&>*]:basis-[calc((100%-48px)/3)]";

/** Tarjetas fantasma mientras carga: una vista, que es lo mínimo que puede llegar con datos. */
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
  /** Se muestra en lugar de la fila cuando el backend no devolvió ninguno. */
  vacio: { icono: React.ReactNode; titulo: string; texto: string };
  /** Cuántos llegaron: con 0 va el aviso de vacío. */
  cantidad: number;
  esqueleto: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Hasta dónde se puede desplazar la fila, para prender y apagar las flechas.
 * Se recalcula al scrollear y al cambiar el ancho; el `ResizeObserver` también
 * avisa apenas empieza a observar, así que cubre el estado inicial.
 */
function useDesplazamiento(fila: React.RefObject<HTMLDivElement | null>, montada: boolean) {
  const [puede, setPuede] = useState({ atras: false, adelante: false });

  useEffect(() => {
    const el = fila.current;
    if (!el) return;
    const medir = () => {
      // 1 px de tolerancia: el ancho de las tarjetas es fraccionario.
      const atras = el.scrollLeft > 1;
      const adelante = el.scrollLeft + el.clientWidth < el.scrollWidth - 1;
      setPuede((p) => (p.atras === atras && p.adelante === adelante ? p : { atras, adelante }));
    };
    const ro = new ResizeObserver(medir);
    ro.observe(el);
    el.addEventListener("scroll", medir, { passive: true });
    return () => {
      ro.disconnect();
      el.removeEventListener("scroll", medir);
    };
  }, [fila, montada]);

  /** Avanza o retrocede una vista; el snap la deja alineada. */
  const mover = (sentido: 1 | -1) => {
    const el = fila.current;
    if (!el) return;
    const reducido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollBy({ left: sentido * el.clientWidth, behavior: reducido ? "auto" : "smooth" });
  };

  return { ...puede, mover };
}

/**
 * Encabezado + fila de una sección de destacados de la landing. Cuántos y
 * cuáles los decide el backend (de 0 a 6): la fila muestra una vista y el
 * resto se desliza, así la sección ocupa siempre una sola línea. Si no llega
 * nada, queda un aviso en vez de desaparecer, para no romper el ancla del nav.
 *
 * Las flechas son para quien usa mouse, que no tiene cómo scrollear de
 * costado; en celular se desliza con el dedo y no se muestran.
 */
export default function Destacados({
  etiqueta, titulo, bajada, href, verTodas, cargando, error, onRetry, vacio, cantidad, esqueleto, children,
}: DestacadosProps) {
  const fila = useRef<HTMLDivElement>(null);
  const anterior = useRef<HTMLButtonElement>(null);
  const siguiente = useRef<HTMLButtonElement>(null);
  const hayFila = !cargando && !error && cantidad > 0;
  const { atras, adelante, mover } = useDesplazamiento(fila, hayFila);
  const id = useId();

  // Al llegar a una punta, la flecha de ese lado se deshabilita y el foco se
  // caería al `body`: quien navega con teclado sigue en la del otro lado.
  useEffect(() => {
    const activo = document.activeElement;
    if (!adelante && activo === siguiente.current) anterior.current?.focus();
    if (!atras && activo === anterior.current) siguiente.current?.focus();
  }, [atras, adelante]);

  return (
    <>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="t-label mb-2.5 text-brown-700">{etiqueta}</div>
          <h2 id={`${id}-titulo`} className="m-0 font-display text-[32px] font-bold tracking-[-.01em] text-fg-1">{titulo}</h2>
          <p className="mt-2.5 mb-0 max-w-[540px] text-base text-fg-2">{bajada}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {/* Si todo entra en una vista no hay nada que deslizar. */}
          {hayFila && (atras || adelante) && (
            <div className="mr-2 flex gap-2 max-[680px]:hidden">
              <IconButton ref={anterior} aria-label="Ver anteriores" aria-controls={`${id}-fila`} disabled={!atras} onClick={() => mover(-1)}>
                <ChevronLeft />
              </IconButton>
              <IconButton ref={siguiente} aria-label="Ver siguientes" aria-controls={`${id}-fila`} disabled={!adelante} onClick={() => mover(1)}>
                <ChevronRight />
              </IconButton>
            </div>
          )}
          <Link href={href} className={buttonClasses({ variant: "neutral" })}>
            {verTodas} <ArrowRight size={16} />
          </Link>
        </div>
      </div>

      <AsyncBoundary
        loading={cargando}
        error={error}
        onRetry={onRetry}
        pad={48}
        // Misma fila, pero quieta: no tiene sentido deslizar fantasmas.
        skeleton={<div className={cn(FILA, "overflow-hidden")}>{Array.from({ length: FANTASMAS }, (_, i) => <Fragment key={i}>{esqueleto}</Fragment>)}</div>}
      >
        {cantidad === 0 ? (
          // Sin CTA: el visitante no puede crear destacados.
          <EmptyState icon={vacio.icono} title={vacio.titulo}>{vacio.texto}</EmptyState>
        ) : (
          <div ref={fila} id={`${id}-fila`} role="region" aria-labelledby={`${id}-titulo`} className={FILA}>{children}</div>
        )}
      </AsyncBoundary>
    </>
  );
}
