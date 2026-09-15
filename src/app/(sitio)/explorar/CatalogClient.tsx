"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Sprout, MapPin, ChevronRight, RotateCcw, Warehouse, ArrowRight, SearchX, Search, CalendarDays,
} from "lucide-react";
import AsyncBoundary from "@/components/AsyncBoundary";
import Photo, { seedDeId } from "@/components/landing/Photo";
import { FilterSelect, MultiFilterSelect, Pagination, ActiveFilterPill, CropChip, SearchField } from "@/components/catalog/controls";
import { Skeleton } from "@/components/ui";
import { useBusquedaDiferida } from "@/hooks/useBusquedaDiferida";
import { useCatalogoActividades, useFiltroCultivosActividad, useFiltroDepartamentosActividad } from "@/hooks/useCatalogoActividades";
import { moneyAr } from "@/lib/format";
import type { ActividadResumen, FilterOption } from "@/types/catalogo";

const PAGE_SIZE = 9;

/** Misma grilla para las tarjetas y para el skeleton, así nada salta al llegar los datos. */
const GRILLA = "grid gap-6 grid-cols-1 min-[681px]:grid-cols-2 min-[1041px]:grid-cols-3";

/* ---- Tarjeta de actividad ---------------------------------------------- */
function CatalogCard({ act, cultivosIds }: { act: ActividadResumen; cultivosIds: string[] }) {
  return (
    <Link href={`/explorar/${act.id}`} className="card-hover" style={{ textDecoration: "none", display: "flex", flexDirection: "column", background: "var(--surface)", border: "1px solid var(--outline-variant)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
      <div style={{ position: "relative" }}>
        {/* Sin foto cargada queda el degradado del propio id, estable entre pantallas. */}
        <Photo seed={seedDeId(act.id)} height={180} radius={0} src={act.fotoPortada?.url} alt={act.fotoPortada ? act.nombre : ""} />
      </div>

      <div style={{ display: "flex", flexDirection: "column", flex: 1, padding: 18, gap: 12 }}>
        {act.nombreDepartamento && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--fg-3)", fontSize: 13 }}>
            <MapPin size={14} color="var(--brown-700)" />
            <span style={{ fontWeight: 500, color: "var(--fg-2)" }}>{act.nombreDepartamento}, Mendoza</span>
          </div>
        )}
        <h3 style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18.5, color: "var(--fg-1)", lineHeight: 1.25 }}>{act.nombre}</h3>
        <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--fg-3)", fontSize: 13 }}>
          <Warehouse size={14} color="var(--fg-3)" />
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{act.nombreEstablecimiento}</span>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {act.cultivos.map((c) => <CropChip key={c.id} active={cultivosIds.includes(c.id)}>{c.nombre}</CropChip>)}
        </div>
        <div style={{ marginTop: "auto", paddingTop: 14, borderTop: "1px solid var(--cream-tert)", display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 12 }}>
          <div style={{ minWidth: 0 }}>
            <div className="t-label" style={{ marginBottom: 2 }}>Desde</div>
            {/* Sin precio publicado todavía no hay monto que mostrar. */}
            {act.precioRegular === null ? (
              <span style={{ fontSize: 14.5, fontWeight: 600, color: "var(--fg-3)" }}>A consultar</span>
            ) : (
              <div style={{ display: "flex", alignItems: "baseline", gap: 5 }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 19, fontWeight: 700, color: "var(--fg-1)" }}>{moneyAr(act.precioRegular)}</span>
                <span style={{ fontSize: 12.5, color: "var(--fg-3)" }}>/ persona</span>
              </div>
            )}
          </div>
          <span className="btn btn-primary btn-sm" style={{ flexShrink: 0, whiteSpace: "nowrap" }}>
            Ver detalle <ArrowRight size={16} />
          </span>
        </div>
      </div>
    </Link>
  );
}

/** Mismo alto y misma grilla que las tarjetas, para que nada salte al llegar los datos. */
function GrillaSkeleton() {
  return (
    <div className={GRILLA}>
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} style={{ background: "var(--surface)", border: "1px solid var(--outline-variant)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
          <Skeleton className="h-[180px] rounded-none" />
          <div style={{ padding: 18, display: "flex", flexDirection: "column", gap: 12 }}>
            <Skeleton className="h-3.5 w-2/5" />
            <Skeleton className="h-5 w-4/5" />
            <Skeleton className="h-3.5 w-3/5" />
            <Skeleton className="h-6 w-1/3 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Caja vacía del listado: mismo marco para los dos motivos por los que no hay nada. */
function Vacio({ icon, titulo, children, accion }: { icon: React.ReactNode; titulo: string; children: React.ReactNode; accion?: React.ReactNode }) {
  return (
    <div style={{ textAlign: "center", padding: "64px 32px", background: "var(--surface)", border: "1px dashed var(--sand)", borderRadius: "var(--radius-lg)" }}>
      <div style={{ width: 68, height: 68, borderRadius: "50%", background: "var(--cream-tert)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px" }}>
        {icon}
      </div>
      <h3 style={{ margin: "0 0 8px", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 21, color: "var(--fg-1)" }}>{titulo}</h3>
      <p style={{ margin: accion ? "0 auto 22px" : "0 auto", color: "var(--fg-2)", fontSize: 15.5, maxWidth: 440, lineHeight: 1.5 }}>
        {children}
      </p>
      {accion}
    </div>
  );
}

/** Nombres de las opciones elegidas, para las pills de filtro activo. */
function etiqueta(opciones: FilterOption[], value: string): string {
  return opciones.find((o) => o.value === value)?.label ?? value;
}

export default function CatalogClient() {
  const [cultivosIds, setCultivosIds] = useState<string[]>([]);
  const [departamentoId, setDepartamentoId] = useState<string | null>(null);
  // 0-based, igual que el `Pageable` del backend; la paginación se muestra en 1-based.
  const [page, setPage] = useState(0);
  const { texto, setTexto, busqueda, aplicarYa, limpiar } = useBusquedaDiferida();

  // Búsqueda, filtros y paginado los resuelve el backend, así que cualquier
  // cambio vuelve a pedir el listado.
  const { data, isLoading, error, reload } = useCatalogoActividades({ busqueda, cultivosIds, departamentoId, page, size: PAGE_SIZE });
  const cultivos = useFiltroCultivosActividad();
  const departamentos = useFiltroDepartamentosActividad();

  const total = data?.totalElements ?? 0;
  const hayFiltros = busqueda !== "" || cultivosIds.length > 0 || departamentoId !== null;
  // Sin filtros y sin resultados: no hay nada publicado todavía, que no es lo
  // mismo que "tu búsqueda no encontró nada".
  const catalogoVacio = data !== null && total === 0 && !hayFiltros;

  // Cualquier cambio de criterio vuelve a la primera página: la que estabas
  // mirando puede no existir con los resultados nuevos.
  const escribir = (v: string) => { setTexto(v); setPage(0); };
  const elegirCultivos = (v: string[]) => { setCultivosIds(v); setPage(0); };
  const elegirDepartamento = (v: string | null) => { setDepartamentoId(v); setPage(0); };
  const limpiarBusqueda = () => { limpiar(); setPage(0); };
  const limpiarTodo = () => { limpiar(); setCultivosIds([]); setDepartamentoId(null); setPage(0); };

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 28px 80px" }}>
      <div style={{ marginBottom: 24, maxWidth: 720 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--fg-3)", fontSize: 13, marginBottom: 10 }}>
          <Link href="/" style={{ color: "var(--fg-3)", textDecoration: "none" }}>Inicio</Link>
          <ChevronRight size={14} />
          <span style={{ color: "var(--fg-2)", fontWeight: 500 }}>Explorar actividades</span>
        </div>
        <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 38, color: "var(--fg-1)", margin: 0, letterSpacing: "-.015em", lineHeight: 1.1 }}>
          Descubrí <span style={{ color: "var(--green-800)" }}>experiencias</span> en toda la provincia
        </h1>
        <p style={{ color: "var(--fg-2)", fontSize: 16, lineHeight: 1.55, margin: "12px 0 0" }}>
          Cosechas, podas, recorridos y degustaciones en fincas de Mendoza. Buscá por nombre o filtrá por tipo de cultivo y por departamento para encontrar la tuya.
        </p>
      </div>

      {/* Sin nada publicado no hay por qué buscar ni filtrar. */}
      {!catalogoVacio && (
        <div style={{ background: "var(--surface)", border: "1px solid var(--outline-variant)", borderRadius: "var(--radius-lg)", padding: 20, marginBottom: 22, display: "flex", alignItems: "flex-end", gap: 16, flexWrap: "wrap" }}>
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
            allLabel={cultivos.isLoading ? "Cargando cultivos…" : "Todos los cultivos"}
            plural="cultivos"
            values={cultivosIds}
            options={cultivos.data ?? []}
            onChange={elegirCultivos}
          />
          <FilterSelect
            icon={<MapPin size={18} />}
            label="Departamento"
            allLabel={departamentos.isLoading ? "Cargando departamentos…" : "Todos los departamentos"}
            value={departamentoId}
            options={departamentos.data ?? []}
            onChange={elegirDepartamento}
          />
          {hayFiltros && (
            <button type="button" onClick={limpiarTodo} style={{ height: 46, display: "inline-flex", alignItems: "center", gap: 7, background: "transparent", border: "none", cursor: "pointer", color: "var(--green-800)", fontFamily: "var(--font-sans)", fontSize: 14.5, fontWeight: 600, padding: "0 6px" }}>
              <RotateCcw size={16} color="var(--green-800)" /> Limpiar todo
            </button>
          )}
        </div>
      )}

      <AsyncBoundary loading={isLoading} error={error} onRetry={reload} skeleton={<GrillaSkeleton />}>
        {catalogoVacio ? (
          <Vacio icon={<CalendarDays size={30} color="var(--brown-700)" />} titulo="Todavía no hay experiencias publicadas">
            Cuando los productores publiquen sus actividades vas a poder verlas acá, con sus fotos, lo que incluyen y su precio.
          </Vacio>
        ) : (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18, flexWrap: "wrap" }}>
              <span style={{ fontSize: 15, color: "var(--fg-2)" }}>
                <strong style={{ color: "var(--fg-1)", fontWeight: 700 }}>{total}</strong>{" "}
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
                  label={etiqueta(cultivos.data ?? [], id)}
                  onClear={() => elegirCultivos(cultivosIds.filter((x) => x !== id))}
                />
              ))}
              {departamentoId && (
                <ActiveFilterPill
                  icon={<MapPin size={13} />}
                  label={etiqueta(departamentos.data ?? [], departamentoId)}
                  onClear={() => elegirDepartamento(null)}
                />
              )}
            </div>

            {total === 0 ? (
              <Vacio
                icon={<SearchX size={30} color="var(--fg-3)" />}
                titulo="No encontramos experiencias"
                accion={
                  <button type="button" className="btn btn-neutral" onClick={limpiarTodo}>
                    <RotateCcw size={17} /> Limpiar todo
                  </button>
                }
              >
                {busqueda !== ""
                  ? "Ninguna actividad coincide con lo que buscaste. Probá con otras palabras o quitá los filtros."
                  : "Ninguna actividad coincide con los filtros elegidos. Probá quitando alguno para ver más opciones."}
              </Vacio>
            ) : (
              <>
                <div className={GRILLA}>
                  {(data?.items ?? []).map((act) => <CatalogCard key={act.id} act={act} cultivosIds={cultivosIds} />)}
                </div>
                {/* El backend numera desde 0 y la paginación desde 1. */}
                <Pagination page={page + 1} pages={data?.totalPages ?? 1} onPage={(n) => setPage(n - 1)} />
              </>
            )}
          </>
        )}
      </AsyncBoundary>

      <style>{`
        .card-hover { transition: box-shadow .16s, border-color .16s, transform .16s; }
        .card-hover:hover { box-shadow: var(--shadow-hover); border-color: var(--sand); transform: translateY(-2px); }
      `}</style>
    </div>
  );
}
