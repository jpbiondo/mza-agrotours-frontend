"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ChevronDown, ChevronRight, Headset, HelpCircle, LifeBuoy, MessagesSquare, RotateCcw, SearchX,
} from "lucide-react";
import AsyncBoundary from "@/components/AsyncBoundary";
import { Button, Skeleton, buttonClasses } from "@/components/ui";
import {
  FaqChips, FaqDesplegable, contarPorCategoria, etiquetaCat,
} from "@/components/faq/piezas";
import { useFaqPublica } from "@/hooks/useFaq";
import { cn } from "@/lib/utils";
import type { FaqItem } from "@/types/catalogo";

/* ---- Una entrada del acordeón ----------------------------------------- */
function FaqFila({ item, open, onToggle }: { item: FaqItem; open: boolean; onToggle: () => void }) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border bg-surface transition-[border-color,box-shadow] duration-200",
        open ? "border-green-300 shadow-hover" : "border-outline-variant",
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full cursor-pointer items-center gap-4 bg-transparent px-[22px] py-5 text-left"
      >
        <span
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-[10px] transition-colors",
            open ? "bg-green-800 text-white" : "bg-green-050 text-green-800",
          )}
        >
          <HelpCircle className="size-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-display text-lg leading-[1.35] font-semibold text-fg-1">{item.q}</span>
          <span className="t-label mt-[7px] inline-block text-[11px]">{etiquetaCat(item.cat)}</span>
        </span>
        <ChevronDown
          className={cn(
            "size-[22px] shrink-0 transition-[transform,color] duration-200",
            open ? "rotate-180 text-green-800" : "text-fg-3",
          )}
        />
      </button>

      <FaqDesplegable open={open} className="pr-[22px] pb-[22px] pl-[78px]">
        <p className="text-[15.5px] leading-relaxed text-pretty text-fg-2">{item.a}</p>
      </FaqDesplegable>
    </div>
  );
}

/* ---- Estado vacío ------------------------------------------------------ */
function FaqVacio({ sinDatos, onVerTodas }: { sinDatos: boolean; onVerTodas: () => void }) {
  return (
    <div className="rounded-lg border border-dashed border-sand bg-surface px-6 py-14 text-center">
      <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-cream-tert text-fg-3">
        {sinDatos ? <MessagesSquare className="size-[26px]" /> : <SearchX className="size-[26px]" />}
      </div>
      <h2 className="mb-2 font-display text-xl font-bold text-fg-1">
        {sinDatos ? "Todavía no hay preguntas frecuentes" : "No hay preguntas en esta categoría"}
      </h2>
      <p className="mx-auto max-w-[380px] text-[15px] text-fg-2">
        {sinDatos
          ? "Estamos armando la base de conocimiento. Mientras tanto, escribinos y te ayudamos."
          : "Probá con otra categoría o mirá todas las preguntas."}
      </p>
      {!sinDatos && (
        <Button variant="neutral" className="mt-5" onClick={onVerTodas}>
          <RotateCcw className="size-[17px]" /> Ver todas
        </Button>
      )}
    </div>
  );
}

/* ---- Esqueleto --------------------------------------------------------- */
function FaqEsqueleto() {
  return (
    <div aria-busy="true" aria-label="Cargando preguntas…">
      <div className="mb-[26px] flex flex-wrap gap-2">
        {Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-9 w-28 rounded-pill" />)}
      </div>
      <div className="flex flex-col gap-3">
        {Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-[86px] rounded-lg" />)}
      </div>
    </div>
  );
}

/* ---- Listado ----------------------------------------------------------- */
function FaqListado({ items }: { items: FaqItem[] }) {
  const [cat, setCat] = useState("todas");
  const [openId, setOpenId] = useState<string | null>(null);

  const counts = useMemo(() => contarPorCategoria(items), [items]);
  const visible = useMemo(
    () => (cat === "todas" ? items : items.filter((i) => i.cat === cat)),
    [items, cat],
  );

  // Al cambiar de categoría, la pregunta abierta se cierra sólo si deja de verse.
  function filtrar(nueva: string) {
    setCat(nueva);
    const sigue = items.some((i) => i.id === openId && (nueva === "todas" || i.cat === nueva));
    if (!sigue) setOpenId(null);
  }

  if (items.length === 0) return <FaqVacio sinDatos onVerTodas={() => filtrar("todas")} />;

  return (
    <>
      <div className="mb-[26px]">
        <FaqChips value={cat} onChange={filtrar} counts={counts} />
      </div>

      {visible.length === 0 ? (
        <FaqVacio sinDatos={false} onVerTodas={() => filtrar("todas")} />
      ) : (
        <>
          <div className="mb-3.5 text-[13.5px] text-fg-3">
            {visible.length} {visible.length === 1 ? "pregunta" : "preguntas"}
            {cat !== "todas" && <> · {etiquetaCat(cat).toLowerCase()}</>}
          </div>
          <div className="flex flex-col gap-3">
            {visible.map((it) => (
              <FaqFila
                key={it.id}
                item={it}
                open={openId === it.id}
                onToggle={() => setOpenId(openId === it.id ? null : it.id)}
              />
            ))}
          </div>
        </>
      )}
    </>
  );
}

/* ---- Página ------------------------------------------------------------ */
export default function AyudaClient() {
  const { data, isLoading, error, reload } = useFaqPublica();

  return (
    <main className="mx-auto max-w-[880px] px-7 pt-11 pb-[88px]">
      {/* Breadcrumb */}
      <nav aria-label="Ruta" className="mb-4 flex items-center gap-2 text-[13px] text-fg-3">
        <Link href="/" className="text-fg-3 no-underline hover:text-fg-2">Inicio</Link>
        <ChevronRight className="size-3.5" />
        <span>Ayuda</span>
        <ChevronRight className="size-3.5" />
        <span className="font-medium text-fg-2">Preguntas frecuentes</span>
      </nav>

      {/* Encabezado */}
      <div className="mb-3 flex items-center gap-3.5">
        <span className="flex size-[52px] shrink-0 items-center justify-center rounded-[14px] border border-green-100 bg-green-050 text-green-800">
          <MessagesSquare className="size-[26px]" />
        </span>
        <h1 className="font-display text-[34px] leading-[1.12] font-bold tracking-[-.01em] text-fg-1">
          Preguntas frecuentes
        </h1>
      </div>
      <p className="mb-7 max-w-[600px] text-[17px] leading-normal text-fg-2">
        Resolvé las dudas más comunes sobre reservas, cuentas y la gestión de tu finca. Tocá una pregunta para ver la respuesta.
      </p>

      <AsyncBoundary loading={isLoading} error={error} onRetry={reload} skeleton={<FaqEsqueleto />}>
        <FaqListado items={data} />
      </AsyncBoundary>

      {/* CTA de soporte */}
      <div className="mt-10 flex flex-wrap items-center justify-between gap-6 rounded-lg border border-green-100 bg-green-050 px-[30px] py-7">
        <div className="flex min-w-[280px] items-center gap-4">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-brown-100 text-brown-700">
            <LifeBuoy className="size-6" />
          </span>
          <div>
            <h2 className="mb-1 font-display text-[19px] font-bold text-fg-1">¿No encontraste lo que buscabas?</h2>
            <p className="text-sm text-fg-2">Nuestro equipo te responde dentro de las 24 horas hábiles.</p>
          </div>
        </div>
        {/* TODO: el diseño lleva a la carga de incidencias, que todavía no existe
            del lado del visitante; mientras tanto, al formulario de contacto. */}
        <Link href="/#contacto" className={buttonClasses()}>
          <Headset className="size-[17px]" /> Contactar soporte
        </Link>
      </div>
    </main>
  );
}
