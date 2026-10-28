"use client";

import { useEffect, useId, useState } from "react";
import Link from "next/link";
import { Banknote, CalendarDays, ChevronRight, MapPin, RotateCcw, Search, Sprout, Star } from "lucide-react";
import { AsyncView } from "@/components/AsyncView";
import { Button, EmptyState, Skeleton } from "@/components/ui";
import ActividadCard, { ActividadCardSkeleton } from "@/components/catalog/ActividadCard";
import {
  ActiveFilterPill, ChipGroup, FilterSelect, MoreFiltersButton, MultiFilterSelect, Pagination, SearchField, SortToggles,
} from "@/components/catalog/controls";
import { useBusquedaDiferida } from "@/hooks/useBusquedaDiferida";
import { useCatalogoActividades, useFacetasActividades } from "@/hooks/useCatalogoActividades";
import { clasificarError } from "@/lib/errores";
import { etiquetaRangoPrecio, hrefExplorar } from "@/lib/filtrosExplorar";
import type { FiltrosExplorar } from "@/lib/filtrosExplorar";
import { cn } from "@/lib/utils";
import type { DireccionOrden, FilterOption, RangoPrecio } from "@/types/catalogo";

const PAGE_SIZE = 9;

/** Misma grilla para las tarjetas y para el skeleton, así nada salta al llegar los datos. */
const GRILLA = "grid gap-5 grid-cols-1 min-[681px]:grid-cols-2 min-[1041px]:grid-cols-3";

function GrillaSkeleton() {
  return (
    <div className={GRILLA}>
      {Array.from({ length: 6 }, (_, i) => <ActividadCardSkeleton key={i} />)}
    </div>
  );
}

/** Misma forma que un `ChipGroup`: la etiqueta y una fila de píldoras. */
function ChipGroupSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      <Skeleton className="h-3.5 w-36" />
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-9 w-28 rounded-pill" />)}
      </div>
    </div>
  );
}

/** Nombres de las opciones elegidas, para las pills de filtro activo. */
function etiqueta(opciones: FilterOption[], value: string): string {
  return opciones.find((o) => o.value === value)?.label ?? value;
}

/** Clave de un rango para el grupo de chips: "8000-12000", "-8000", "16000-". */
function claveRango({ desde, hasta }: RangoPrecio): string {
  return `${desde ?? ""}-${hasta ?? ""}`;
}

export default function CatalogClient({ inicial }: { inicial: FiltrosExplorar }) {
  const [cultivosIds, setCultivosIds] = useState<string[]>(inicial.cultivosIds);
  const [departamentoId, setDepartamentoId] = useState<string | null>(inicial.departamentoId);
  const [precio, setPrecio] = useState<RangoPrecio | null>(inicial.precio);
  const [puntuacionMin, setPuntuacionMin] = useState<number | null>(inicial.puntuacionMin);
  const [ordenPrecio, setOrdenPrecio] = useState<DireccionOrden | null>(inicial.ordenPrecio);
  const [ordenPuntuacion, setOrdenPuntuacion] = useState<DireccionOrden | null>(inicial.ordenPuntuacion);
  // 0-based, igual que el `Pageable` del backend; la paginación se muestra en 1-based.
  const [page, setPage] = useState(inicial.page);
  const { texto, setTexto, busqueda, aplicarYa, limpiar } = useBusquedaDiferida(undefined, inicial.busqueda);

  // Precio y puntuación van plegados en "Más filtros". Si el link ya trae
  // alguno, se abre: si no, el filtro estaría puesto sin que se vea dónde.
  const masFiltrosId = useId();
  const [masFiltros, setMasFiltros] = useState(inicial.precio !== null || inicial.puntuacionMin !== null);
  const filtrosSecundarios = (precio ? 1 : 0) + (puntuacionMin !== null ? 1 : 0);

  const filtros = { busqueda, cultivosIds, departamentoId, precio, puntuacionMin };
  const orden = { ordenPrecio, ordenPuntuacion };

  // Los filtros viven en la URL para poder compartirlos y para que "atrás"
  // vuelva con ellos puestos. `replaceState` y no `push`: cada tecla o click no
  // es un paso del historial.
  const href = hrefExplorar({ ...filtros, ...orden, page });
  useEffect(() => {
    if (href !== window.location.pathname + window.location.search) window.history.replaceState(null, "", href);
  }, [href]);

  // Búsqueda, filtros, orden y paginado los resuelve el backend, así que
  // cualquier cambio vuelve a pedir el listado. Mientras llega queda la página
  // anterior (marcada con `aria-busy`): el esqueleto es sólo para la primera.
  const listado = useCatalogoActividades({ ...filtros, ...orden, page, size: PAGE_SIZE });
  const data = listado.data ?? listado.ultimo;
  const recargando = listado.isLoading && listado.ultimo !== null;

  // El conteo de cada faceta depende de los demás filtros, así que se vuelve a
  // pedir con cada cambio. Mientras llega se siguen mostrando las anteriores:
  // si no, los chips de precio y puntuación desaparecerían y volverían con
  // cada click.
  const facetasQuery = useFacetasActividades(filtros);
  const facetas = facetasQuery.data ?? facetasQuery.ultimo;
  // Sin facetas no se pueden elegir cultivos ni departamentos, pero el listado
  // anda igual: la falla se avisa en el panel, no tapa la pantalla.
  const fallaFacetas = facetas === null ? clasificarError(facetasQuery.error) : null;

  const opcionesPrecio: FilterOption[] = (facetas?.precios ?? []).map((r) => ({
    value: claveRango(r), label: etiquetaRangoPrecio(r), count: r.count,
  }));

  // Una página que no existe (p. ej. `?pagina=99` en un link viejo) traería la
  // grilla vacía con el contador en positivo: se salta a la última que hay.
  if (listado.data && listado.data.totalPages > 0 && page >= listado.data.totalPages) setPage(listado.data.totalPages - 1);

  const total = data?.totalElements ?? 0;
  const hayFiltros = busqueda !== "" || cultivosIds.length > 0 || departamentoId !== null || precio !== null || puntuacionMin !== null;
  // Sin filtros y sin resultados: no hay nada publicado todavía, que no es lo
  // mismo que "tu búsqueda no encontró nada".
  // Sólo con la respuesta fresca: con la anterior y los filtros nuevos (p. ej.
  // al limpiar desde "sin resultados") se vería un vacío que no es.
  const catalogoVacio = listado.data !== null && total === 0 && !hayFiltros;

  // Cualquier cambio de criterio vuelve a la primera página: la que estabas
  // mirando puede no existir con los resultados nuevos, o tener otras.
  const escribir = (v: string) => { setTexto(v); setPage(0); };
  const elegirCultivos = (v: string[]) => { setCultivosIds(v); setPage(0); };
  const elegirDepartamento = (v: string | null) => { setDepartamentoId(v); setPage(0); };
  const elegirPrecio = (clave: string | null) => {
    const r = facetas?.precios.find((o) => claveRango(o) === clave);
    setPrecio(r ? { desde: r.desde, hasta: r.hasta } : null);
    setPage(0);
  };
  const elegirPuntuacion = (v: number | null) => { setPuntuacionMin(v); setPage(0); };
  const ordenarPrecio = (v: DireccionOrden | null) => { setOrdenPrecio(v); setPage(0); };
  const ordenarPuntuacion = (v: DireccionOrden | null) => { setOrdenPuntuacion(v); setPage(0); };
  const limpiarBusqueda = () => { limpiar(); setPage(0); };
  // El orden no es un filtro: limpiar no lo toca.
  const limpiarTodo = () => {
    limpiar(); setCultivosIds([]); setDepartamentoId(null); setPrecio(null); setPuntuacionMin(null); setPage(0);
  };

  return (
    <div className="mx-auto max-w-300 px-7 pt-8 pb-20">
      <div className="mb-6 max-w-180">
        <nav aria-label="Ruta" className="mb-2.5 flex items-center gap-2.5 text-[13px] text-fg-3">
          <Link href="/" className="text-fg-3 no-underline hover:text-fg-2">Inicio</Link>
          <ChevronRight className="size-3.5" aria-hidden />
          <span className="font-medium text-fg-2">Explorar actividades</span>
        </nav>
        <h1 className="m-0 font-display text-[38px] leading-[1.1] font-bold tracking-[-.015em] text-fg-1">
          Descubrí <span className="text-green-800">experiencias</span> en toda la provincia
        </h1>
        <p className="mt-3 mb-0 text-base leading-[1.55] text-fg-2">
          Cosechas, podas, recorridos y degustaciones en fincas de Mendoza. Buscá por nombre o filtrá por tipo de cultivo, departamento, precio o puntuación para encontrar la tuya.
        </p>
      </div>

      {/* Sin nada publicado no hay por qué buscar ni filtrar. */}
      {!catalogoVacio && (
        <div className="mb-5.5 flex flex-wrap items-end gap-4 rounded-lg border border-outline-variant bg-surface p-5">
          <SearchField
            label="Buscar actividad"
            placeholder="Cosecha de Malbec, recorrido por el olivar…"
            value={texto}
            onChange={escribir}
            onSubmit={aplicarYa}
            onClear={limpiarBusqueda}
          />
          <MultiFilterSelect
            icon={<Sprout size={18} />}
            label="Tipos de cultivo"
            allLabel={facetas || fallaFacetas ? "Todos los cultivos" : "Cargando cultivos…"}
            plural="cultivos"
            values={cultivosIds}
            options={facetas?.cultivos ?? []}
            onChange={elegirCultivos}
          />
          <FilterSelect
            icon={<MapPin size={18} />}
            label="Departamento"
            allLabel={facetas || fallaFacetas ? "Todos los departamentos" : "Cargando departamentos…"}
            value={departamentoId}
            options={facetas?.departamentos ?? []}
            onChange={elegirDepartamento}
          />
          <MoreFiltersButton
            open={masFiltros}
            count={filtrosSecundarios}
            controls={masFiltrosId}
            onClick={() => setMasFiltros((o) => !o)}
          />
          {hayFiltros && (
            <Button variant="text" className="h-11.5" onClick={limpiarTodo}>
              <RotateCcw size={16} /> Limpiar filtros
            </Button>
          )}
          {masFiltros && (
            <div
              id={masFiltrosId}
              className="grid basis-full grid-cols-[repeat(auto-fit,minmax(min(100%,320px),1fr))] gap-6 border-t border-outline-variant pt-4.5"
            >
              {/* Sin facetas todavía no hay rangos que ofrecer: los arma el backend. */}
              {fallaFacetas ? (
                <p className="m-0 flex flex-wrap items-center gap-2 text-sm text-fg-2">
                  No pudimos cargar estos filtros. {fallaFacetas.mensaje}
                  <Button variant="text" onClick={facetasQuery.reload}>Reintentar</Button>
                </p>
              ) : facetas === null ? (
                <>
                  <ChipGroupSkeleton />
                  <ChipGroupSkeleton />
                </>
              ) : (
                <>
                  {opcionesPrecio.length > 0 && (
                    <ChipGroup
                      icon={<Banknote />}
                      label="Precio desde (adulto)"
                      value={precio ? claveRango(precio) : null}
                      options={opcionesPrecio}
                      onChange={elegirPrecio}
                    />
                  )}
                  <ChipGroup
                    icon={<Star />}
                    label="Puntuación mínima"
                    value={puntuacionMin !== null ? String(puntuacionMin) : null}
                    options={facetas.puntuaciones}
                    onChange={(v) => elegirPuntuacion(v === null ? null : Number(v))}
                  />
                </>
              )}
            </div>
          )}
        </div>
      )}

      <AsyncView
        query={{ isLoading: listado.isLoading && !recargando, error: listado.error, data, reload: listado.reload }}
        skeleton={<GrillaSkeleton />}
        isEmpty={() => catalogoVacio}
        empty={
          <EmptyState icon={<CalendarDays />} title="Todavía no hay experiencias publicadas">
            Cuando los productores publiquen sus actividades vas a poder verlas acá, con sus fotos, lo que incluyen y su precio.
          </EmptyState>
        }
      >
        {(pagina) => (
          <div aria-busy={recargando} className={cn("transition-opacity", recargando && "opacity-60")}>
            <div className="mb-4.5 flex flex-wrap items-center gap-2">
              <span className="text-[15px] text-fg-2">
                <strong className="font-bold text-fg-1">{total}</strong>{" "}
                {total === 1 ? "experiencia" : "experiencias"}
                {hayFiltros ? (total === 1 ? " encontrada" : " encontradas") : " disponibles"}
              </span>
              {busqueda !== "" && (
                <ActiveFilterPill icon={<Search size={13} />} label={`«${busqueda}»`} onClear={limpiarBusqueda} />
              )}
              {cultivosIds.map((id) => (
                <ActiveFilterPill
                  key={id}
                  icon={<Sprout size={13} />}
                  label={etiqueta(facetas?.cultivos ?? [], id)}
                  onClear={() => elegirCultivos(cultivosIds.filter((x) => x !== id))}
                />
              ))}
              {departamentoId && (
                <ActiveFilterPill
                  icon={<MapPin size={13} />}
                  label={etiqueta(facetas?.departamentos ?? [], departamentoId)}
                  onClear={() => elegirDepartamento(null)}
                />
              )}
              {precio && (
                <ActiveFilterPill icon={<Banknote size={13} />} label={etiquetaRangoPrecio(precio)} onClear={() => elegirPrecio(null)} />
              )}
              {puntuacionMin !== null && (
                <ActiveFilterPill icon={<Star size={13} />} label={`${puntuacionMin} o más`} onClear={() => elegirPuntuacion(null)} />
              )}
              {total > 1 && (
                <div className="ml-auto">
                  {/* Este orden es la prioridad: el backend ordena por precio y desempata por puntuación. */}
                  <SortToggles
                    criterios={[
                      { key: "precio", label: "Precio", icon: <Banknote />, primera: "asc", value: ordenPrecio, onChange: ordenarPrecio },
                      { key: "puntuacion", label: "Puntuación", icon: <Star />, primera: "desc", value: ordenPuntuacion, onChange: ordenarPuntuacion },
                    ]}
                  />
                </div>
              )}
            </div>

            {total === 0 ? (
              <EmptyState kind="no-results" title="No encontramos experiencias" onClear={limpiarTodo}>
                {busqueda !== ""
                  ? "Ninguna actividad coincide con lo que buscaste. Probá con otras palabras o quitá los filtros."
                  : "Ninguna actividad coincide con los filtros elegidos. Probá quitando alguno para ver más opciones."}
              </EmptyState>
            ) : (
              <>
                <div className={GRILLA}>
                  {pagina.items.map((act) => <ActividadCard key={act.id} act={act} cultivosIds={cultivosIds} />)}
                </div>
                {/* El backend numera desde 0 y la paginación desde 1. */}
                <Pagination page={page + 1} pages={pagina.totalPages} onPage={(n) => setPage(n - 1)} />
              </>
            )}
          </div>
        )}
      </AsyncView>
    </div>
  );
}
