"use client";

import { useState } from "react";
import Link from "next/link";
import { Sprout, MapPin, ChevronRight, RotateCcw, Building2, CalendarDays, ArrowRight, SearchX } from "lucide-react";
import AsyncBoundary from "@/components/AsyncBoundary";
import Photo, { seedDeId } from "@/components/landing/Photo";
import { FilterSelect, MultiFilterSelect, Pagination, ActiveFilterPill, CropChip } from "@/components/catalog/controls";
import { Skeleton } from "@/components/ui";
import { useCatalogoEstablecimientos, useFiltroCultivos, useFiltroDepartamentos } from "@/hooks/useCatalogoEstablecimientos";
import type { EstablecimientoResumen, FilterOption } from "@/types/catalogo";

const PAGE_SIZE = 8;

/** Misma grilla para las tarjetas y para el skeleton, así nada salta al llegar los datos. */
const GRILLA = "grid gap-[22px] grid-cols-1 min-[681px]:grid-cols-2 min-[1041px]:grid-cols-3";

function EstablecimientoCard({ est, cultivosIds }: { est: EstablecimientoResumen; cultivosIds: string[] }) {
  return (
    <Link href={`/establecimientos/${est.id}`} className="card-hover" style={{ textDecoration: "none", display: "flex", flexDirection: "column", background: "var(--surface)", border: "1px solid var(--outline-variant)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
      <div style={{ position: "relative" }}>
        {/* TODO backend: el listado todavía no manda imágenes. */}
        <Photo seed={seedDeId(est.id)} height={150} radius={0} />
        {est.departamento && (
          <span style={{ position: "absolute", top: 12, left: 12, display: "inline-flex", alignItems: "center", gap: 5, background: "rgba(251,249,248,.95)", borderRadius: "var(--radius-pill)", padding: "5px 11px", boxShadow: "0 2px 8px rgba(45,90,39,.16)" }}>
            <MapPin size={13} color="var(--brown-700)" />
            <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--fg-1)" }}>{est.departamento.nombre}</span>
          </span>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", flex: 1, padding: 18, gap: 11 }}>
        <div>
          <h3 style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18.5, color: "var(--fg-1)", lineHeight: 1.25 }}>{est.nombre}</h3>
          <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--fg-3)", fontSize: 13, marginTop: 5 }}>
            <Building2 size={14} color="var(--fg-3)" />
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{est.razonSocial}</span>
          </div>
        </div>

        <p style={{ margin: 0, color: est.descripcion ? "var(--fg-2)" : "var(--fg-3)", fontSize: 14, lineHeight: 1.55, fontStyle: est.descripcion ? "normal" : "italic", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical" }}>
          {est.descripcion || "Todavía no cargó una descripción."}
        </p>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {est.cultivos.map((c) => <CropChip key={c.id} active={cultivosIds.includes(c.id)}>{c.nombre}</CropChip>)}
        </div>

        <div style={{ marginTop: "auto", paddingTop: 14, borderTop: "1px solid var(--cream-tert)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12.5, color: "var(--fg-3)" }}>
            <CalendarDays size={13} color="var(--brown-700)" />
            {est.cantidadActividades} {est.cantidadActividades === 1 ? "actividad" : "actividades"}
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13.5, fontWeight: 600, color: "var(--green-800)" }}>
            Ver establecimiento <ArrowRight size={16} />
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
          <Skeleton className="h-[150px] rounded-none" />
          <div style={{ padding: 18, display: "flex", flexDirection: "column", gap: 11 }}>
            <Skeleton className="h-5 w-3/5" />
            <Skeleton className="h-3.5 w-2/5" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-4/5" />
            <Skeleton className="h-6 w-1/3 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Caja vacía del catálogo: mismo marco para los dos motivos por los que no hay nada. */
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

export default function ListClient() {
  const [cultivosIds, setCultivosIds] = useState<string[]>([]);
  const [departamentoId, setDepartamentoId] = useState<string | null>(null);
  // 0-based, igual que el `Pageable` del backend; la paginación se muestra en 1-based.
  const [page, setPage] = useState(0);

  // Filtros y paginado los resuelve el backend, así que cualquier cambio vuelve a pedir.
  const { data, isLoading, error, reload } = useCatalogoEstablecimientos({ cultivosIds, departamentoId, page, size: PAGE_SIZE });
  const cultivos = useFiltroCultivos();
  const departamentos = useFiltroDepartamentos();

  const total = data?.totalElements ?? 0;
  const hayFiltros = cultivosIds.length > 0 || departamentoId !== null;
  // Sin filtros y sin resultados: no hay nada publicado todavía, que no es lo
  // mismo que "tus filtros no encontraron nada".
  const catalogoVacio = data !== null && total === 0 && !hayFiltros;

  const elegirCultivos = (v: string[]) => { setCultivosIds(v); setPage(0); };
  const elegirDepartamento = (v: string | null) => { setDepartamentoId(v); setPage(0); };
  const limpiarFiltros = () => { setCultivosIds([]); setDepartamentoId(null); setPage(0); };

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 28px 80px" }}>
      <div style={{ marginBottom: 24, maxWidth: 720 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--fg-3)", fontSize: 13, marginBottom: 10 }}>
          <Link href="/" style={{ color: "var(--fg-3)", textDecoration: "none" }}>Inicio</Link>
          <ChevronRight size={14} />
          <span style={{ color: "var(--fg-2)", fontWeight: 500 }}>Establecimientos</span>
        </div>
        <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 38, color: "var(--fg-1)", margin: 0, letterSpacing: "-.015em", lineHeight: 1.1 }}>
          Conocé los <span style={{ color: "var(--green-800)" }}>establecimientos</span> de Mendoza
        </h1>
        <p style={{ color: "var(--fg-2)", fontSize: 16, lineHeight: 1.55, margin: "12px 0 0" }}>
          Fincas, bodegas y olivares que abren sus puertas. Mirá un resumen de cada uno y filtrá por uno o varios tipos de cultivo y por departamento para encontrar el que querés visitar.
        </p>
      </div>

      {/* Sin nada publicado no hay por qué filtrar. */}
      {!catalogoVacio && (
        <div style={{ background: "var(--surface)", border: "1px solid var(--outline-variant)", borderRadius: "var(--radius-lg)", padding: 20, marginBottom: 22, display: "flex", alignItems: "flex-end", gap: 16, flexWrap: "wrap" }}>
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
            <button type="button" onClick={limpiarFiltros} style={{ height: 46, display: "inline-flex", alignItems: "center", gap: 7, background: "transparent", border: "none", cursor: "pointer", color: "var(--green-800)", fontFamily: "var(--font-sans)", fontSize: 14.5, fontWeight: 600, padding: "0 6px" }}>
              <RotateCcw size={16} color="var(--green-800)" />
              {cultivosIds.length + (departamentoId ? 1 : 0) > 1 ? "Quitar filtros" : "Quitar filtro"}
            </button>
          )}
        </div>
      )}

      <AsyncBoundary loading={isLoading} error={error} onRetry={reload} skeleton={<GrillaSkeleton />}>
        {catalogoVacio ? (
          <Vacio icon={<Building2 size={30} color="var(--brown-700)" />} titulo="No hay establecimientos disponibles">
            Cuando los productores publiquen sus establecimientos, vas a poder consultarlos acá con su descripción y los cultivos que trabajan.
          </Vacio>
        ) : (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18, flexWrap: "wrap" }}>
              <span style={{ fontSize: 15, color: "var(--fg-2)" }}>
                <strong style={{ color: "var(--fg-1)", fontWeight: 700 }}>{total}</strong>{" "}
                {total === 1 ? "establecimiento" : "establecimientos"}
                {hayFiltros ? (total === 1 ? " encontrado" : " encontrados") : " disponibles"}
              </span>
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
                titulo="No encontramos establecimientos"
                accion={
                  <button type="button" className="btn btn-neutral" onClick={limpiarFiltros}>
                    <RotateCcw size={17} /> Quitar filtros
                  </button>
                }
              >
                Ningún establecimiento coincide con los filtros elegidos. Probá quitándolos para ver todos.
              </Vacio>
            ) : (
              <>
                <div className={GRILLA}>
                  {(data?.items ?? []).map((est) => <EstablecimientoCard key={est.id} est={est} cultivosIds={cultivosIds} />)}
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
