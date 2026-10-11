"use client";

import { useEffect, useRef, useState } from "react";
import { Loader, RotateCcw, Star, StarOff, X } from "lucide-react";
import { Alert, Button, Estrellas, Modal, Skeleton } from "@/components/ui";
import { SimpleSelect } from "@/components/ui/simple-select";
import { useReseniasActividad } from "@/hooks/useCatalogoActividades";
import { fmtPuntaje } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ActividadPublica, OrdenResenias } from "@/types/catalogo";
import ReseniaCard from "./ReseniaCard";

const ORDENES: { value: OrdenResenias; label: string }[] = [
  { value: "recientes", label: "Más recientes a más antiguas" },
  { value: "antiguas", label: "Más antiguas a más recientes" },
];

function estrellasTexto(n: number): string {
  return `${n} ${n === 1 ? "estrella" : "estrellas"}`;
}

function resumenFiltro(total: number, puntaje: number | null): string {
  const resenias = `${total} ${total === 1 ? "reseña" : "reseñas"}`;
  if (puntaje) return `Mostrando ${resenias} de ${estrellasTexto(puntaje)}`;
  return total === 1 ? "Mostrando 1 reseña" : `Mostrando las ${resenias}`;
}

/**
 * Todas las reseñas de la actividad. El resumen (promedio y barras) sale del
 * detalle que ya está cargado; el listado se pide al backend de a páginas,
 * filtrado y ordenado allá, y se van sumando al llegar al final del scroll.
 */
export default function ReseniasModal({ a, onClose }: { a: ActividadPublica; onClose: () => void }) {
  const [puntaje, setPuntaje] = useState<number | null>(null);
  const [orden, setOrden] = useState<OrdenResenias>("recientes");
  const { resenias, total, hayMas, isLoading, error, cargarMas, reintentar } = useReseniasActividad(a.id, puntaje, orden);
  const scrollRef = useRef<HTMLDivElement>(null);
  const finRef = useRef<HTMLDivElement>(null);
  const { promedio, distribucion } = a.resenias;

  // Al asomar el final de la lista, la página siguiente. Se vuelve a enganchar
  // cada vez que termina una carga, así que si la página nueva no alcanza a
  // llenar el alto del modal, pide otra sola.
  useEffect(() => {
    const fin = finRef.current;
    if (!fin || !hayMas || isLoading || error) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) cargarMas(); },
      { root: scrollRef.current, rootMargin: "0px 0px 120px 0px" },
    );
    obs.observe(fin);
    return () => obs.disconnect();
  }, [hayMas, isLoading, error, cargarMas]);

  function filtrar(p: number | null) {
    setPuntaje(p);
    scrollRef.current?.scrollTo({ top: 0 });
  }

  function ordenar(o: string) {
    setOrden(o === "antiguas" ? "antiguas" : "recientes");
    scrollRef.current?.scrollTo({ top: 0 });
  }

  const primeraCarga = total === null;

  return (
    <Modal onClose={onClose} padding="p-0" className="flex max-h-[90vh] w-[720px] flex-col overflow-hidden">
      <div className="flex shrink-0 items-start justify-between gap-4 border-b border-outline-variant px-6 py-5">
        <div className="min-w-0">
          <h2 className="font-display text-[21px] font-bold text-fg-1">Reseñas de visitantes</h2>
          <div className="mt-[3px] truncate text-[13px] text-fg-3">
            {[a.nombre, a.establecimiento.nombre].filter(Boolean).join(" · ")}
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="flex size-[38px] shrink-0 cursor-pointer items-center justify-center rounded-[10px] border border-outline-variant bg-surface text-fg-2 transition-colors hover:bg-cream-tert"
        >
          <X size={20} />
        </button>
      </div>

      <div ref={scrollRef} className="overflow-x-hidden overflow-y-auto p-6">
        {/* Panel estadístico: cada barra filtra por su puntaje, y un segundo click lo saca. */}
        <div className="mb-[22px] grid grid-cols-1 items-center gap-6 rounded-[14px] bg-cream-tert p-[22px] sm:grid-cols-[200px_1fr]">
          <div className="text-center sm:border-r sm:border-outline-variant sm:pr-2">
            <div className="font-display text-[56px] leading-none font-bold text-fg-1">
              {promedio !== null ? fmtPuntaje(promedio) : "—"}
            </div>
            <Estrellas valor={promedio ?? 0} size={18} className="mt-2" />
            <div className="mt-2 text-[13px] text-fg-3">
              {a.resenias.total} {a.resenias.total === 1 ? "reseña" : "reseñas"}
            </div>
          </div>
          <div className="flex flex-col gap-1">
            {distribucion.map((d) => {
              const activo = puntaje === d.puntaje;
              return (
                <button
                  key={d.puntaje}
                  type="button"
                  onClick={() => filtrar(activo ? null : d.puntaje)}
                  aria-pressed={activo}
                  title={`Filtrar por ${estrellasTexto(d.puntaje)}`}
                  className={cn(
                    "flex w-full cursor-pointer items-center gap-2.5 rounded-lg border-0 px-2 py-[5px] text-left transition-colors hover:bg-green-050",
                    activo ? "bg-green-050" : "bg-transparent",
                  )}
                >
                  <span className="flex w-[30px] items-center gap-0.5 font-mono text-[12.5px] text-fg-2">
                    {d.puntaje}<Star size={11} className="fill-star text-star" aria-hidden />
                  </span>
                  <span className="h-2 flex-1 overflow-hidden rounded bg-surface">
                    <span className="block h-full rounded bg-star transition-[width] duration-200" style={{ width: `${d.porcentaje}%` }} />
                  </span>
                  <span className="w-16 text-right font-mono text-xs text-fg-3">{d.porcentaje}% · {d.cantidad}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mb-4 flex flex-wrap items-center justify-between gap-4 border-b border-outline-variant pb-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="t-label mr-0.5">Estrellas</span>
            {[null, 5, 4, 3, 2, 1].map((p) => {
              const on = puntaje === p;
              return (
                <button
                  key={p ?? "todas"}
                  type="button"
                  onClick={() => filtrar(p)}
                  aria-pressed={on}
                  className={cn(
                    "inline-flex cursor-pointer items-center gap-[3px] rounded-full border px-[13px] py-1.5 text-[13px] font-semibold transition-colors",
                    on ? "border-green-800 bg-green-800 text-white" : "border-outline-variant bg-surface text-fg-2 hover:bg-cream-tert",
                  )}
                >
                  {p === null ? "Todas" : <>{p}<Star size={12} className={on ? "fill-white text-white" : "fill-star text-star"} aria-hidden /></>}
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-2">
            <span className="t-label">Ordenar</span>
            <SimpleSelect value={orden} onChange={ordenar} options={ORDENES} className="min-w-[230px]" />
          </div>
        </div>

        {total !== null && total > 0 && (
          <div className="mb-3.5 text-[13px] text-fg-3">{resumenFiltro(total, puntaje)}</div>
        )}

        {total === 0 ? (
          <div className="rounded-xl border border-dashed border-outline-variant bg-cream-tert px-6 py-12 text-center">
            <StarOff size={28} className="mx-auto text-fg-3" aria-hidden />
            <div className="mt-2.5 text-[14.5px] font-semibold text-fg-2">No hay reseñas con este filtro</div>
            <div className="mt-1 text-[13px] text-fg-3">Probá con otra cantidad de estrellas.</div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {resenias.map((r, i) => <ReseniaCard key={i} r={r} />)}
            {primeraCarga && isLoading && Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-[104px] rounded-xl" />)}
          </div>
        )}

        {error ? (
          <Alert className="mt-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span>No pudimos cargar {primeraCarga ? "las reseñas" : "más reseñas"}.</span>
              <Button variant="neutral" size="sm" onClick={reintentar}>
                <RotateCcw size={14} aria-hidden /> Reintentar
              </Button>
            </div>
          </Alert>
        ) : !primeraCarga && hayMas ? (
          <div className="flex items-center justify-center gap-2.5 pt-6 pb-2 text-[13px] text-fg-3">
            <Loader size={18} className="spin text-green-700" aria-hidden /> Cargando más reseñas…
          </div>
        ) : !primeraCarga && resenias.length > 0 ? (
          <div className="pt-5 pb-1 text-center text-[12.5px] text-fg-3">
            Llegaste al final · {total} {total === 1 ? "reseña" : "reseñas"}
          </div>
        ) : null}

        <div ref={finRef} aria-hidden className="h-px" />
      </div>
    </Modal>
  );
}
