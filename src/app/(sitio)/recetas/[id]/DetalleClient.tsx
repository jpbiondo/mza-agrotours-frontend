"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft, ArrowRight, Check, ChevronRight, Clock, Gauge, Leaf, ListOrdered, SearchX,
  ShoppingBasket, Sprout, UtensilsCrossed, Users,
} from "lucide-react";
import AsyncBoundary from "@/components/AsyncBoundary";
import Photo, { seedDeId } from "@/components/landing/Photo";
import { Button, Card, Skeleton } from "@/components/ui";
import { useRecetaDetalle } from "@/hooks/useCatalogoRecetas";
import { cn } from "@/lib/utils";
import type { CultivoDeReceta, DificultadId, RecetaDetalle } from "@/types/recetas";

const DIFICULTAD_LABEL: Record<DificultadId, string> = {
  FACIL: "Fácil",
  MEDIA: "Media",
  DIFICIL: "Difícil",
};

/* ---- Piezas -------------------------------------------------------------- */

function Seccion({ icon, titulo, sub, className, children }: {
  icon: React.ReactNode; titulo: string; sub?: string; className?: string; children: React.ReactNode;
}) {
  return (
    <section className={className}>
      <div className="mb-[18px]">
        <div className="mb-1.5 flex items-center gap-2">
          {icon}
          <h2 className="m-0 font-display text-[22px] font-bold tracking-[-.005em] text-fg-1">{titulo}</h2>
        </div>
        {sub && <p className="m-0 max-w-[600px] text-sm text-fg-2">{sub}</p>}
      </div>
      {children}
    </section>
  );
}

/** Caja de texto para lo que la receta todavía no tiene cargado. */
function Vacio({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-sand bg-surface px-6 py-9 text-center text-[14.5px] text-fg-2">
      {children}
    </div>
  );
}

/** Dato del encabezado: ícono en cuadrado verde + etiqueta y valor. */
function Dato({ icon, label, children }: {
  icon: React.ReactNode; label: string; children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-green-050 text-green-800">
        {icon}
      </div>
      <div className="leading-tight">
        <div className="t-label">{label}</div>
        <div className="mt-[3px] text-sm font-semibold text-fg-1">{children}</div>
      </div>
    </div>
  );
}

/** Cultivo asociado: lleva a su ficha, que es de donde salen sus datos. */
function CultivoChip({ cultivo }: { cultivo: CultivoDeReceta }) {
  return (
    <Link
      href={`/cultivos/${cultivo.id}`}
      className="inline-flex items-center gap-2.5 rounded-pill border border-outline-variant bg-surface py-2 pr-3.5 pl-2 text-sm font-semibold text-fg-1 no-underline transition-colors hover:border-green-800 hover:bg-green-050"
    >
      <span className="inline-flex size-[26px] shrink-0 items-center justify-center rounded-full bg-green-800">
        <Leaf size={13} className="text-white/90" />
      </span>
      {cultivo.nombre}
      <ArrowRight size={14} className="text-fg-3" />
    </Link>
  );
}

/**
 * Lista de ingredientes tachable. El tildado es del navegador y no se guarda en
 * ningún lado: es para ir marcando lo que ya tenés mientras cocinás.
 */
function Ingredientes({ ingredientes }: { ingredientes: string[] }) {
  const [tildados, setTildados] = useState<Record<number, boolean>>({});

  return (
    <Card className="px-6 py-5">
      <ul className="m-0 flex list-none flex-col gap-1 p-0">
        {ingredientes.map((ing, i) => {
          const on = !!tildados[i];
          return (
            <li key={i}>
              <label
                className={cn(
                  "flex cursor-pointer items-start gap-3 rounded-sm px-2 py-2.5 transition-colors",
                  on ? "bg-green-050" : "hover:bg-cream-tert",
                )}
              >
                <input
                  type="checkbox"
                  checked={on}
                  onChange={() => setTildados((s) => ({ ...s, [i]: !s[i] }))}
                  className="sr-only"
                />
                <span
                  aria-hidden
                  className={cn(
                    "mt-px inline-flex size-5 shrink-0 items-center justify-center rounded-[5px] border-[1.5px]",
                    on ? "border-green-800 bg-green-800" : "border-sand bg-surface",
                  )}
                >
                  {on && <Check size={13} className="text-white" />}
                </span>
                <span
                  className={cn(
                    "text-[14.5px] leading-snug",
                    on ? "text-fg-3 line-through" : "text-fg-1",
                  )}
                >
                  {ing}
                </span>
              </label>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

function DetalleSkeleton() {
  return (
    <div className="grid grid-cols-1 items-stretch gap-8 min-[941px]:grid-cols-[1.05fr_1fr]">
      <Skeleton className="h-[380px] w-full rounded-lg" />
      <div className="flex flex-col justify-center gap-4">
        <Skeleton className="h-3 w-[132px]" />
        <Skeleton className="h-10 w-4/5" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/5" />
        <Skeleton className="mt-4 h-[68px] w-full" />
      </div>
    </div>
  );
}

function NoEncontrada() {
  return (
    <div className="rounded-lg border border-dashed border-sand bg-surface px-8 py-16 text-center">
      <div className="mx-auto mb-[18px] flex h-[68px] w-[68px] items-center justify-center rounded-full bg-cream-tert">
        <SearchX size={30} className="text-fg-3" />
      </div>
      <h1 className="mt-0 mb-2 font-display text-2xl font-bold text-fg-1">No encontramos esa receta</h1>
      <p className="mx-auto mb-[22px] max-w-[420px] text-[15.5px] leading-relaxed text-fg-2">
        Puede que haya dejado de estar publicada o que el enlace esté mal.
      </p>
      <Link href="/recetas" className="no-underline">
        <Button><ArrowLeft size={16} /> Volver al recetario</Button>
      </Link>
    </div>
  );
}

/* ---- Contenido ----------------------------------------------------------- */

function Detalle({ receta }: { receta: RecetaDetalle }) {
  return (
    <>
      <div className="grid grid-cols-1 items-stretch gap-8 min-[941px]:grid-cols-[1.05fr_1fr]">
        <div className="overflow-hidden rounded-lg">
          {/* TODO backend: el recetario todavía no manda imágenes. */}
          <Photo seed={seedDeId(receta.id)} height={380} radius={0} icon={UtensilsCrossed} />
        </div>

        <div className="flex flex-col justify-center">
          <div className="t-label mb-3 text-brown-700">RECETA TRADICIONAL</div>
          <h1 className="m-0 font-display text-[38px] leading-[1.12] font-bold tracking-[-.01em] text-fg-1">
            {receta.nombre}
          </h1>
          {receta.descripcion && (
            <p className="mt-4 mb-0 text-base leading-relaxed text-pretty text-fg-2">{receta.descripcion}</p>
          )}

          <div className="mt-6 grid grid-cols-1 gap-3 border-y border-cream-tert py-4 min-[481px]:grid-cols-3">
            {/* El tiempo ya viene formateado del backend ("1 h 15 min"). */}
            <Dato icon={<Clock size={16} />} label="TIEMPO">{receta.tiempo || "—"}</Dato>
            <Dato icon={<Users size={16} />} label="PORCIONES">{receta.porciones}</Dato>
            <Dato icon={<Gauge size={16} />} label="DIFICULTAD">
              {DIFICULTAD_LABEL[receta.dificultad]}
            </Dato>
          </div>
        </div>
      </div>

      <Seccion
        className="mt-12"
        icon={<Sprout size={18} className="text-green-800" />}
        titulo="Cultivos asociados"
        sub={receta.cultivos.length > 0
          ? "Esta receta se prepara con productos de las fincas mendocinas. Tocá uno para ver su ficha."
          : undefined}
      >
        {receta.cultivos.length === 0 ? (
          <Vacio>Esta receta todavía no tiene cultivos asociados.</Vacio>
        ) : (
          <div className="flex flex-wrap gap-3">
            {receta.cultivos.map((c) => <CultivoChip key={c.id} cultivo={c} />)}
          </div>
        )}
      </Seccion>

      <div className="mt-12 grid grid-cols-1 items-start gap-8 min-[941px]:grid-cols-[1fr_1.5fr]">
        <Seccion icon={<ShoppingBasket size={18} className="text-green-800" />} titulo="Ingredientes">
          {receta.ingredientes.length === 0 ? (
            <Vacio>Esta receta todavía no tiene cargados sus ingredientes.</Vacio>
          ) : (
            <Ingredientes ingredientes={receta.ingredientes} />
          )}
        </Seccion>

        <Seccion icon={<ListOrdered size={18} className="text-green-800" />} titulo="Pasos a seguir">
          {receta.pasos.length === 0 ? (
            <Vacio>Esta receta todavía no tiene cargada su preparación.</Vacio>
          ) : (
            <ol className="m-0 flex list-none flex-col gap-3.5 p-0">
              {receta.pasos.map((p) => (
                <li key={p.numero}>
                  <Card className="flex items-start gap-4 px-[22px] py-[18px]">
                    <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-green-800 font-mono text-[15px] font-bold text-white">
                      {p.numero}
                    </span>
                    <p className="m-0 text-[15px] leading-relaxed text-pretty text-fg-1">{p.descripcion}</p>
                  </Card>
                </li>
              ))}
            </ol>
          )}
        </Seccion>
      </div>
    </>
  );
}

/* ---- Pantalla ------------------------------------------------------------ */

export default function DetalleClient({ id }: { id: string }) {
  const { data, isLoading, error, reload } = useRecetaDetalle(id);

  return (
    <div className="mx-auto max-w-[1160px] px-7 pt-7 pb-20">
      <div className="mb-3.5 flex flex-wrap items-center gap-2.5 text-[13px] text-fg-3">
        <Link href="/" className="text-fg-3 no-underline">Inicio</Link>
        <ChevronRight size={14} />
        <Link href="/recetas" className="text-fg-3 no-underline">Recetas</Link>
        <ChevronRight size={14} />
        <span className="font-medium text-fg-2">{data?.nombre ?? "Detalle"}</span>
      </div>

      <Link href="/recetas" className="mb-[18px] inline-flex items-center gap-[7px] text-sm font-semibold text-green-800 no-underline">
        <ArrowLeft size={16} /> Volver a recetas
      </Link>

      <AsyncBoundary loading={isLoading} error={error} onRetry={reload} skeleton={<DetalleSkeleton />}>
        {/* `data` en null es un id que no existe, no una falla de la lectura. */}
        {data ? <Detalle receta={data} /> : <NoEncontrada />}
      </AsyncBoundary>
    </div>
  );
}
