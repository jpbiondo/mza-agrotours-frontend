"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight, ArrowUpDown, ChevronRight, Clock, Leaf, List, ListOrdered, RotateCcw, SearchX,
  UtensilsCrossed, Users, X,
} from "lucide-react";
import AsyncBoundary from "@/components/AsyncBoundary";
import Photo, { seedDeId } from "@/components/landing/Photo";
import { Pagination } from "@/components/catalog/controls";
import { Button, Card, EstadoBadge, Skeleton } from "@/components/ui";
import { SimpleSelect } from "@/components/ui/simple-select";
import { useCatalogoRecetas, useFiltrosRecetas } from "@/hooks/useCatalogoRecetas";
import { cn } from "@/lib/utils";
import type {
  DificultadId, DuracionId, FiltrosRecetas, OrdenRecetas, RecetaResumen,
} from "@/types/recetas";

/** El backend pagina de a 9 por defecto; la grilla es de 3 columnas. */
const PAGE_SIZE = 9;

/** Misma grilla para las tarjetas y para el esqueleto, así nada salta al llegar los datos. */
const GRILLA = "grid gap-[22px] grid-cols-1 min-[681px]:grid-cols-2 min-[1041px]:grid-cols-3";

const DIFICULTAD_LABEL: Record<DificultadId, string> = {
  FACIL: "Fácil",
  MEDIA: "Media",
  DIFICIL: "Difícil",
};

/** El rango de cada duración lo define el backend; acá sólo se nombra. */
const DURACION_LABEL: Record<DuracionId, string> = {
  RAPIDA: "Rápidas",
  MEDIA: "Medias",
  LARGA: "Largas",
};

/**
 * Orden del listado. El valor es el `sort` de Spring: se ordena del lado del
 * backend porque el listado viene paginado y ordenar sólo la página a la vista
 * daría un orden falso. `null` es el que ya aplica el backend por defecto.
 */
const ORDENES: Record<string, OrdenRecetas> = {
  Sugerido: null,
  "Menor tiempo": "tiempoMinsAprox,asc",
  "Más porciones": "porciones,desc",
  "Nombre (A–Z)": "nombre,asc",
};
const ORDEN_OPCIONES = Object.keys(ORDENES);

/* ---- Filtros ------------------------------------------------------------- */

function FiltroPill({ on, icon, label, cantidad, onClick }: {
  on: boolean;
  icon?: React.ReactNode;
  label: string;
  cantidad?: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={cn(
        "inline-flex cursor-pointer items-center gap-2 rounded-pill border px-3.5 py-[9px] text-[13.5px] font-semibold transition-colors",
        on ? "border-green-800 bg-green-800 text-white" : "border-sand bg-surface text-fg-2 hover:bg-cream-tert",
      )}
    >
      {icon && <span className={cn("inline-flex", on ? "text-white" : "text-fg-3")}>{icon}</span>}
      {label}
      {cantidad !== undefined && (
        <span
          className={cn(
            "ml-0.5 rounded-pill px-2 py-0.5 font-mono text-[11.5px] font-bold",
            on ? "bg-white/20 text-white" : "bg-cream-tert text-fg-3",
          )}
        >
          {cantidad}
        </span>
      )}
    </button>
  );
}

/** Fila del bloque de filtros: etiqueta angosta a la izquierda, píldoras a la derecha. */
function FiltroFila({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2.5 py-3.5 min-[681px]:flex-row min-[681px]:items-start min-[681px]:gap-[18px]">
      <div className="t-label shrink-0 leading-tight min-[681px]:w-[92px] min-[681px]:pt-2.5">{label}</div>
      <div className="flex min-w-0 flex-1 flex-wrap gap-2">{children}</div>
    </div>
  );
}

function Separador() {
  return <div className="h-px bg-cream-tert" />;
}

interface Seleccion {
  dificultad: DificultadId | null;
  duracion: DuracionId | null;
  cultivoId: string | null;
}

function BloqueFiltros({ filtros, total, seleccion, onChange }: {
  filtros: FiltrosRecetas;
  total: number;
  seleccion: Seleccion;
  onChange: (s: Partial<Seleccion>) => void;
}) {
  return (
    <Card className="mb-7 px-[22px] py-1">
      <FiltroFila label="Dificultad">
        <FiltroPill
          on={seleccion.dificultad === null}
          icon={<List size={15} />}
          label="Todas"
          cantidad={total}
          onClick={() => onChange({ dificultad: null })}
        />
        {filtros.dificultades.map((d) => (
          <FiltroPill
            key={d.valor}
            on={seleccion.dificultad === d.valor}
            label={DIFICULTAD_LABEL[d.valor]}
            cantidad={d.cantidad}
            onClick={() => onChange({ dificultad: d.valor })}
          />
        ))}
      </FiltroFila>

      <Separador />

      <FiltroFila label="Duración">
        <FiltroPill
          on={seleccion.duracion === null}
          icon={<Clock size={15} />}
          label="Cualquiera"
          onClick={() => onChange({ duracion: null })}
        />
        {filtros.duraciones.map((d) => (
          <FiltroPill
            key={d.valor}
            on={seleccion.duracion === d.valor}
            label={DURACION_LABEL[d.valor]}
            cantidad={d.cantidad}
            onClick={() => onChange({ duracion: d.valor })}
          />
        ))}
      </FiltroFila>

      <Separador />

      <FiltroFila label="Cultivo">
        <FiltroPill
          on={seleccion.cultivoId === null}
          icon={<Leaf size={15} />}
          label="Todos"
          onClick={() => onChange({ cultivoId: null })}
        />
        {filtros.cultivos.map((c) => (
          <FiltroPill
            key={c.id}
            on={seleccion.cultivoId === c.id}
            label={c.nombre}
            cantidad={c.cantidad}
            onClick={() => onChange({ cultivoId: c.id })}
          />
        ))}
      </FiltroFila>
    </Card>
  );
}

function FiltrosSkeleton() {
  return (
    <Card className="mb-7 flex flex-col gap-6 px-[22px] py-[18px]">
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex flex-wrap items-center gap-2">
          <Skeleton className="mr-4 h-3 w-[72px]" />
          <Skeleton className="h-[38px] w-[104px] rounded-pill" />
          <Skeleton className="h-[38px] w-[92px] rounded-pill" />
          <Skeleton className="h-[38px] w-[110px] rounded-pill" />
        </div>
      ))}
    </Card>
  );
}

/* ---- Tarjeta ------------------------------------------------------------- */

function Stat({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-[5px] whitespace-nowrap">{icon}{children}</span>
  );
}

function RecetaCard({ receta }: { receta: RecetaResumen }) {
  return (
    <Link
      href={`/recetas/${receta.id}`}
      className="flex flex-col overflow-hidden rounded-lg border border-outline-variant bg-surface no-underline transition-[box-shadow,border-color,transform] hover:-translate-y-px hover:border-sand hover:shadow-hover"
    >
      <div className="relative">
        {/* TODO backend: el recetario todavía no manda imágenes. */}
        <Photo seed={seedDeId(receta.id)} height={176} radius={0} icon={UtensilsCrossed} />
        <EstadoBadge tone="neutral" className="absolute top-3 left-3 shadow-hover">
          {DIFICULTAD_LABEL[receta.dificultad]}
        </EstadoBadge>
      </div>

      <div className="flex flex-1 flex-col gap-2.5 p-[18px]">
        <h3 className="m-0 font-display text-[19px] leading-tight font-semibold text-fg-1">{receta.nombre}</h3>

        <div className="flex flex-wrap items-center gap-3.5 text-[12.5px] text-fg-3">
          {/* El tiempo ya viene formateado del backend ("1 h 15 min"). */}
          {receta.tiempo && <Stat icon={<Clock size={13} />}>{receta.tiempo}</Stat>}
          <Stat icon={<Users size={13} />}>{receta.porciones} porc.</Stat>
          <Stat icon={<ListOrdered size={13} />}>
            {receta.cantidadPasos} {receta.cantidadPasos === 1 ? "paso" : "pasos"}
          </Stat>
        </div>

        {receta.cultivos.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {receta.cultivos.map((c) => (
              <span
                key={c.id}
                className="inline-flex items-center gap-1.5 rounded-pill bg-cream-tert py-1 pr-2.5 pl-1.5 text-[11.5px] font-medium text-fg-2"
              >
                <span className="inline-flex size-[15px] shrink-0 items-center justify-center rounded-full bg-green-050">
                  <Leaf size={9} className="text-green-800" />
                </span>
                {c.nombre}
              </span>
            ))}
          </div>
        )}

        <div className="mt-auto flex items-center justify-between border-t border-cream-tert pt-3">
          <span className="text-[12.5px] text-fg-3">Ver receta</span>
          <ArrowRight size={15} className="text-green-800" />
        </div>
      </div>
    </Link>
  );
}

function GrillaSkeleton() {
  return (
    <div className={GRILLA}>
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="overflow-hidden rounded-lg border border-outline-variant bg-surface">
          <Skeleton className="h-[176px] rounded-none" />
          <div className="flex flex-col gap-3 p-[18px]">
            <Skeleton className="h-5 w-3/5" />
            <Skeleton className="h-3.5 w-4/5" />
            <Skeleton className="h-3.5 w-2/5" />
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

const SIN_FILTROS: Seleccion = { dificultad: null, duracion: null, cultivoId: null };

export default function RecetasListClient() {
  const [seleccion, setSeleccion] = useState<Seleccion>(SIN_FILTROS);
  const [orden, setOrden] = useState(ORDEN_OPCIONES[0]);
  // 0-based, igual que el `Pageable` del backend; la paginación se muestra en 1-based.
  const [page, setPage] = useState(0);

  const filtros = useFiltrosRecetas();
  const { data, isLoading, error, reload } = useCatalogoRecetas({
    ...seleccion,
    orden: ORDENES[orden] ?? null,
    page,
    size: PAGE_SIZE,
  });

  // Total del recetario sin filtrar: sale de los contadores de dificultad, que
  // cubren todas las recetas exactamente una vez. `totalElements` no sirve acá
  // porque ya viene filtrado.
  const totalRecetario = (filtros.data?.dificultades ?? []).reduce((n, d) => n + d.cantidad, 0);

  const total = data?.totalElements ?? 0;
  const hayFiltro = seleccion.dificultad !== null || seleccion.duracion !== null || seleccion.cultivoId !== null;
  // Sin filtro y sin resultados no hay recetas cargadas, que no es lo mismo que
  // "tu filtro no encontró ninguna".
  const recetarioVacio = data !== null && total === 0 && !hayFiltro;
  const sinResultados = data !== null && total === 0 && hayFiltro;

  // Cualquier cambio de filtro vuelve a la primera página: la que estabas mirando
  // puede no existir con el filtro nuevo.
  const filtrar = (cambio: Partial<Seleccion>) => {
    setSeleccion((s) => ({ ...s, ...cambio }));
    setPage(0);
  };
  const limpiar = () => { setSeleccion(SIN_FILTROS); setPage(0); };

  return (
    <div className="mx-auto max-w-[1160px] px-7 pt-8 pb-20">
      <div className="mb-8 max-w-[720px]">
        <div className="mb-2.5 flex items-center gap-2.5 text-[13px] text-fg-3">
          <Link href="/" className="text-fg-3 no-underline">Inicio</Link>
          <ChevronRight size={14} />
          <span className="font-medium text-fg-2">Recetas</span>
        </div>
        <h1 className="m-0 font-display text-[38px] leading-[1.1] font-bold tracking-[-.015em] text-fg-1">
          Recetas de la finca
        </h1>
        <p className="mt-3 mb-0 text-base leading-relaxed text-fg-2">
          Cociná con lo que se cosecha en Mendoza. Recetas tradicionales y conservas caseras para aprovechar cada
          cultivo en su mejor momento.
        </p>
      </div>

      {/* Los filtros son otra lectura: si falla, el listado se sigue viendo sin
          ellos en vez de tumbar la pantalla entera. */}
      {!recetarioVacio && (
        filtros.isLoading ? (
          <FiltrosSkeleton />
        ) : filtros.data ? (
          <BloqueFiltros
            filtros={filtros.data}
            total={totalRecetario}
            seleccion={seleccion}
            onChange={filtrar}
          />
        ) : null
      )}

      <AsyncBoundary loading={isLoading} error={error} onRetry={reload} skeleton={<GrillaSkeleton />}>
        {recetarioVacio ? (
          <Vacio icon={<UtensilsCrossed size={28} className="text-brown-700" />} titulo="Todavía no hay recetas">
            Cuando el recetario tenga recetas vas a poder explorarlas acá, filtrando por dificultad, duración y
            cultivo.
          </Vacio>
        ) : sinResultados ? (
          <Vacio
            icon={<SearchX size={28} className="text-fg-3" />}
            titulo="Ninguna receta coincide con estos filtros"
            accion={
              <Button variant="neutral" className="mt-2" onClick={limpiar}>
                <RotateCcw size={16} /> Limpiar filtros
              </Button>
            }
          >
            Probá aflojar alguno de los filtros para ver más opciones.
          </Vacio>
        ) : (
          <>
            <div className="mb-3.5 flex flex-wrap items-center justify-between gap-4">
              <div className="inline-flex flex-wrap items-center gap-2.5 text-[13.5px] text-fg-3">
                <span>
                  Mostrando <strong className="font-semibold text-fg-2">{total}</strong>{" "}
                  {total === 1 ? "receta" : "recetas"}
                </span>
                {hayFiltro && (
                  <button
                    type="button"
                    onClick={limpiar}
                    className="inline-flex cursor-pointer items-center gap-[5px] rounded-pill border border-sand bg-surface px-2.5 py-1 text-xs font-semibold text-fg-2 hover:bg-cream-tert"
                  >
                    <X size={13} /> Limpiar filtros
                  </button>
                )}
              </div>

              <label className="inline-flex items-center gap-2 text-[13px] text-fg-3">
                <ArrowUpDown size={14} />
                Ordenar
                <SimpleSelect
                  value={orden}
                  onChange={(v) => { setOrden(v); setPage(0); }}
                  options={ORDEN_OPCIONES}
                  className="h-[38px]! w-auto min-w-[152px] text-[13.5px] font-semibold"
                />
              </label>
            </div>

            <div className={GRILLA}>
              {(data?.items ?? []).map((r) => <RecetaCard key={r.id} receta={r} />)}
            </div>
            {/* El backend numera desde 0 y la paginación desde 1. */}
            <Pagination page={page + 1} pages={data?.totalPages ?? 1} onPage={(n) => setPage(n - 1)} />
          </>
        )}
      </AsyncBoundary>
    </div>
  );
}
