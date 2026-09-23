"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight, CalendarDays, ChevronRight, Info, Leaf, List, Moon, RotateCcw, SearchX, Sprout,
} from "lucide-react";
import AsyncBoundary from "@/components/AsyncBoundary";
import Photo, { seedDeId } from "@/components/landing/Photo";
import { Pagination } from "@/components/catalog/controls";
import { Button, Card, EstadoBadge, Skeleton } from "@/components/ui";
import { useCatalogoCultivos, useTotalesTemporada } from "@/hooks/useCatalogoCultivos";
import { useMesActual } from "@/hooks/useMesActual";
import { cn } from "@/lib/utils";
import type { CultivoResumen, FiltroTemporada, TotalesTemporada } from "@/types/cultivos";

const PAGE_SIZE = 12;

/** Misma grilla para las tarjetas y para el esqueleto, así nada salta al llegar los datos. */
const GRILLA = "grid gap-[22px] grid-cols-1 min-[681px]:grid-cols-2 min-[1041px]:grid-cols-3";

const MESES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

/* ---- Filtro de temporada ------------------------------------------------- */

/** Las tres opciones, con el valor que viaja al backend en `enTemporada`. */
const FILTROS: { valor: FiltroTemporada; label: string; icono: typeof List; total: keyof TotalesTemporada }[] = [
  { valor: null, label: "Todos", icono: List, total: "todos" },
  { valor: true, label: "En temporada", icono: Sprout, total: "enTemporada" },
  { valor: false, label: "Fuera de temporada", icono: Moon, total: "fueraDeTemporada" },
];

function FiltroTemporadaPills({ valor, totales, onChange }: {
  valor: FiltroTemporada;
  totales: TotalesTemporada | null;
  onChange: (v: FiltroTemporada) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar por temporada">
      {FILTROS.map((f) => {
        const on = f.valor === valor;
        return (
          <button
            key={f.label}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(f.valor)}
            className={cn(
              "inline-flex cursor-pointer items-center gap-2 rounded-pill border px-4 py-2.5 text-[13.5px] font-semibold transition-colors",
              on ? "border-green-800 bg-green-800 text-white" : "border-sand bg-surface text-fg-2 hover:bg-cream-tert",
            )}
          >
            <f.icono size={15} className={on ? "text-white" : "text-fg-3"} />
            {f.label}
            <span
              className={cn(
                "ml-0.5 rounded-pill px-2 py-0.5 font-mono text-[11.5px] font-bold",
                on ? "bg-white/20 text-white" : "bg-cream-tert text-fg-3",
              )}
            >
              {/* Los contadores son otra lectura: hasta que llega, un guion. */}
              {totales ? totales[f.total] : "—"}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/* ---- Tarjeta ------------------------------------------------------------- */

function CultivoCard({ cultivo }: { cultivo: CultivoResumen }) {
  return (
    <Link
      href={`/cultivos/${cultivo.id}`}
      className="flex flex-col overflow-hidden rounded-lg border border-outline-variant bg-surface no-underline transition-[box-shadow,border-color,transform] hover:-translate-y-px hover:border-sand hover:shadow-hover"
    >
      <div className="relative">
        {/* Decorativa: el nombre del cultivo está en el encabezado de al lado.
            Sin imagen cargada queda el degradado por seed. */}
        <Photo seed={seedDeId(cultivo.id)} height={170} radius={0} icon={Leaf} src={cultivo.foto?.url} alt="" />
        <EstadoBadge tone={cultivo.enTemporada ? "success" : "neutral"} className="absolute top-3 right-3 shadow-hover">
          {cultivo.enTemporada ? "En temporada" : "Fuera de temporada"}
        </EstadoBadge>
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-[18px]">
        <h3 className="m-0 font-display text-[19px] leading-tight font-semibold text-fg-1">{cultivo.nombre}</h3>
        <div className="mt-auto flex items-center gap-1.5 pt-2 text-[13px] text-fg-2">
          <CalendarDays size={14} className="shrink-0 text-green-700" />
          {/* Sin meses de cosecha cargados el backend no manda resumen. */}
          {cultivo.resumenCosecha ? `Cosecha: ${cultivo.resumenCosecha}` : "Sin meses de cosecha cargados"}
        </div>
        <span className="inline-flex items-center gap-1.5 pt-2 text-[13px] font-semibold text-green-800">
          Ver cultivo <ArrowRight size={15} />
        </span>
      </div>
    </Link>
  );
}

function GrillaSkeleton() {
  return (
    <div className={GRILLA}>
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="overflow-hidden rounded-lg border border-outline-variant bg-surface">
          <Skeleton className="h-[170px] rounded-none" />
          <div className="flex flex-col gap-3 p-[18px]">
            <Skeleton className="h-5 w-3/5" />
            <Skeleton className="h-3.5 w-2/5" />
            <Skeleton className="h-3.5 w-1/4" />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---- Caja vacía ---------------------------------------------------------- */

function Vacio({ icon, titulo, children, accion }: {
  icon: React.ReactNode; titulo: string; children: React.ReactNode; accion?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-sand bg-surface px-6 py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-cream-tert">{icon}</div>
      <div className="font-display text-xl font-semibold text-fg-1">{titulo}</div>
      <p className="m-0 max-w-[460px] text-[14.5px] leading-relaxed text-fg-2">{children}</p>
      {accion}
    </div>
  );
}

/* ---- Pantalla ------------------------------------------------------------ */

export default function CultivosListClient() {
  const [enTemporada, setEnTemporada] = useState<FiltroTemporada>(null);
  // 0-based, igual que el `Pageable` del backend; la paginación se muestra en 1-based.
  const [page, setPage] = useState(0);

  // El filtro y el paginado los resuelve el backend, así que cualquier cambio
  // vuelve a pedir el listado.
  const { data, isLoading, error, reload } = useCatalogoCultivos({ enTemporada, page, size: PAGE_SIZE });
  const totales = useTotalesTemporada();
  const mesActual = useMesActual();

  const total = data?.totalElements ?? 0;
  // Sin filtro y sin resultados no hay cultivos cargados, que no es lo mismo que
  // "tu filtro no encontró ninguno". Se mira el propio listado y no los
  // contadores: son dos lecturas distintas y la otra puede no haber llegado.
  const catalogoVacio = data !== null && total === 0 && enTemporada === null;
  const sinResultados = data !== null && total === 0 && enTemporada !== null;

  const filtrar = (v: FiltroTemporada) => { setEnTemporada(v); setPage(0); };

  return (
    <div className="mx-auto max-w-[1160px] px-7 pt-8 pb-20">
      <div className="mb-8 max-w-[720px]">
        <div className="mb-2.5 flex items-center gap-2.5 text-[13px] text-fg-3">
          <Link href="/" className="text-fg-3 no-underline">Inicio</Link>
          <ChevronRight size={14} />
          <span className="font-medium text-fg-2">Cultivos</span>
        </div>
        <h1 className="m-0 font-display text-[38px] leading-[1.1] font-bold tracking-[-.015em] text-fg-1">
          Cultivos de Mendoza
        </h1>
        <p className="mt-3 mb-0 text-base leading-relaxed text-fg-2">
          Conocé los cultivos que se trabajan en las fincas mendocinas: cuándo se cosechan, qué aportan a tu
          alimentación y en qué actividades podés participar de su cosecha.
        </p>
      </div>

      {!catalogoVacio && (
        <Card className="mb-7 flex flex-wrap items-center justify-between gap-4 p-[18px]">
          <FiltroTemporadaPills valor={enTemporada} totales={totales.data} onChange={filtrar} />
          {/* El mes sale del navegador y recién aparece al hidratar; el "en
              temporada" de cada cultivo lo decide el backend. */}
          {mesActual !== null && (
            <div className="inline-flex items-center gap-1.5 text-[13px] text-fg-3">
              <Info size={14} />
              Mes actual: <strong className="font-semibold text-fg-2">{MESES[mesActual]}</strong>
            </div>
          )}
        </Card>
      )}

      <AsyncBoundary loading={isLoading} error={error} onRetry={reload} skeleton={<GrillaSkeleton />}>
        {catalogoVacio ? (
          <Vacio icon={<Sprout size={28} className="text-brown-700" />} titulo="Todavía no hay cultivos cargados">
            Cuando el catálogo tenga cultivos vas a poder consultarlos acá, con su estacionalidad, sus propiedades
            y las actividades en las que se cosechan.
          </Vacio>
        ) : sinResultados ? (
          <Vacio
            icon={<SearchX size={28} className="text-fg-3" />}
            titulo="No hay cultivos en este filtro"
            accion={
              <Button variant="neutral" className="mt-2" onClick={() => filtrar(null)}>
                <RotateCcw size={16} /> Ver todos
              </Button>
            }
          >
            {enTemporada === true
              ? "Ningún cultivo está en cosecha este mes. Mirá el calendario de cada uno para saber cuándo vuelve."
              : "Ningún cultivo coincide con el filtro elegido."}
          </Vacio>
        ) : (
          <>
            <div className="mb-3.5 text-[13.5px] text-fg-3">
              Mostrando <strong className="font-semibold text-fg-2">{total}</strong>{" "}
              {total === 1 ? "cultivo" : "cultivos"}
            </div>
            <div className={GRILLA}>
              {(data?.items ?? []).map((c) => <CultivoCard key={c.id} cultivo={c} />)}
            </div>
            {/* El backend numera desde 0 y la paginación desde 1. */}
            <Pagination page={page + 1} pages={data?.totalPages ?? 1} onPage={(n) => setPage(n - 1)} />
          </>
        )}
      </AsyncBoundary>
    </div>
  );
}
