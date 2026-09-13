"use client";

import Link from "next/link";
import {
  ArrowLeft, ArrowRight, BookOpen, CalendarDays, CheckCircle2, ChevronRight, Leaf, MapPin,
  SearchX, Tractor,
} from "lucide-react";
import AsyncBoundary from "@/components/AsyncBoundary";
import CalendarioTemporada from "@/components/cultivos/CalendarioTemporada";
import Photo, { seedDeId } from "@/components/landing/Photo";
import { Button, Card, EstadoBadge, Skeleton } from "@/components/ui";
import { useCultivoDetalle } from "@/hooks/useCatalogoCultivos";
import { useMesActual } from "@/hooks/useMesActual";
import { moneyAr } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ActividadDeCultivo, CultivoDetalle } from "@/types/cultivos";

const TARJETA_HOVER =
  "transition-[box-shadow,border-color,transform] hover:-translate-y-0.5 hover:border-sand hover:shadow-hover";

/* ---- Piezas -------------------------------------------------------------- */

function Seccion({ icon, titulo, sub, className, children }: {
  icon: React.ReactNode; titulo: string; sub?: string; className?: string; children: React.ReactNode;
}) {
  return (
    <section className={className}>
      <div className="mb-4">
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

/** Caja de texto para lo que el cultivo todavía no tiene cargado. */
function Vacio({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-sand bg-surface px-6 py-9 text-center text-[14.5px] text-fg-2">
      {children}
    </div>
  );
}

function NutricionCard({ cultivo }: { cultivo: CultivoDetalle }) {
  const { informacionNutricional: datos, beneficios, porcionReferencia } = cultivo;

  if (datos.length === 0 && beneficios.length === 0) {
    return <Vacio>Este cultivo todavía no tiene cargada su información nutricional.</Vacio>;
  }

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center gap-2.5 border-b border-cream-tert px-[22px] pt-[18px] pb-3.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-green-050">
          <Leaf size={16} className="text-green-800" />
        </div>
        <div>
          <div className="font-display text-[17px] font-semibold text-fg-1">Información nutricional</div>
          {porcionReferencia && (
            <div className="mt-0.5 text-xs text-fg-3">Valores por porción de {porcionReferencia}</div>
          )}
        </div>
      </div>

      {datos.length === 0 ? (
        <p className="m-0 px-[22px] py-4 text-sm text-fg-2">Todavía no se cargaron los valores nutricionales.</p>
      ) : (
        <ul className="m-0 list-none px-1.5 py-2">
          {datos.map((d, i) => (
            <li
              key={d.nombre}
              className={cn(
                "flex items-baseline justify-between rounded-sm px-4 py-2.5",
                i % 2 === 1 && "bg-cream-tert",
              )}
            >
              <span className="text-[13.5px] text-fg-2">{d.nombre}</span>
              <span className="font-mono text-[13.5px] font-semibold text-fg-1">{d.valor}</span>
            </li>
          ))}
        </ul>
      )}

      {beneficios.length > 0 && (
        <div className="border-t border-cream-tert px-[22px] pt-3.5 pb-5">
          <div className="t-label mb-2.5">BENEFICIOS</div>
          <ul className="m-0 flex list-none flex-col gap-2 p-0">
            {beneficios.map((b) => (
              <li key={b} className="flex items-start gap-2 text-[13.5px] leading-snug text-fg-1">
                <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-green-700" />
                {b}
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}

function ActividadCard({ actividad }: { actividad: ActividadDeCultivo }) {
  const ubicacion = [actividad.establecimiento, actividad.departamento].filter(Boolean).join(" · ");
  return (
    <Link
      href={`/explorar/${actividad.id}`}
      className={cn("flex flex-col overflow-hidden rounded-lg border border-outline-variant bg-surface no-underline", TARJETA_HOVER)}
    >
      {/* TODO backend: el detalle todavía no manda imágenes de las actividades. */}
      <Photo seed={seedDeId(actividad.id)} height={130} radius={0} />
      <div className="flex flex-1 flex-col gap-[7px] p-4">
        <h4 className="m-0 font-display text-[15.5px] leading-tight font-semibold text-fg-1">{actividad.titulo}</h4>
        {ubicacion && (
          <div className="inline-flex items-center gap-1.5 text-[12.5px] text-fg-2">
            <MapPin size={13} className="shrink-0 text-brown-700" /> {ubicacion}
          </div>
        )}
        <div className="mt-auto flex items-baseline justify-between gap-2 border-t border-cream-tert pt-2.5">
          {/* `null` es "todavía sin precio publicado", que no es lo mismo que $ 0. */}
          {actividad.precio === null ? (
            <span className="text-sm font-semibold text-fg-3">A consultar</span>
          ) : (
            <span>
              <span className="font-mono text-[15px] font-semibold text-green-800">{moneyAr(actividad.precio)}</span>
              <span className="text-[11.5px] text-fg-3"> / pers.</span>
            </span>
          )}
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-800">
            Ver <ArrowRight size={13} />
          </span>
        </div>
      </div>
    </Link>
  );
}

function DetalleSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-[360px] w-full rounded-lg" />
      <Skeleton className="h-8 w-2/5" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-4/5" />
      <Skeleton className="h-4 w-3/5" />
    </div>
  );
}

function NoEncontrado() {
  return (
    <div className="rounded-lg border border-dashed border-sand bg-surface px-8 py-16 text-center">
      <div className="mx-auto mb-[18px] flex h-[68px] w-[68px] items-center justify-center rounded-full bg-cream-tert">
        <SearchX size={30} className="text-fg-3" />
      </div>
      <h1 className="mt-0 mb-2 font-display text-2xl font-bold text-fg-1">No encontramos ese cultivo</h1>
      <p className="mx-auto mb-[22px] max-w-[420px] text-[15.5px] leading-relaxed text-fg-2">
        Puede que haya dejado de estar publicado o que el enlace esté mal.
      </p>
      <Link href="/cultivos" className="no-underline">
        <Button><ArrowLeft size={16} /> Volver al listado</Button>
      </Link>
    </div>
  );
}

/* ---- Contenido ----------------------------------------------------------- */

function Detalle({ cultivo }: { cultivo: CultivoDetalle }) {
  const mesActual = useMesActual();
  // El detalle no trae `enTemporada`: se deriva del mismo calendario que se
  // dibuja abajo, así la píldora y la barra nunca se contradicen. El listado, en
  // cambio, usa el que calcula el backend con el mes del servidor.
  const enTemporada = mesActual !== null &&
    cultivo.calendario.some((m) => m.indice === mesActual && m.estado === "cosecha");

  return (
    <>
      <div className="relative mb-8 overflow-hidden rounded-lg">
        {/* TODO backend: el detalle todavía no manda imágenes; va el placeholder. */}
        <Photo seed={seedDeId(cultivo.id)} height={360} radius={0} icon={Leaf} />
        <div className="absolute inset-0 flex flex-col justify-end bg-linear-to-r from-green-900/80 via-green-900/25 to-transparent p-9">
          <div className="max-w-[600px]">
            {mesActual !== null && (
              <EstadoBadge tone={enTemporada ? "success" : "neutral"}>
                {enTemporada ? "En temporada" : "Fuera de temporada"}
              </EstadoBadge>
            )}
            <h1 className="mt-4 mb-0 font-display text-[44px] leading-[1.1] font-bold tracking-[-.01em] text-white">
              {cultivo.nombre}
            </h1>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-8 min-[941px]:grid-cols-[1.55fr_1fr]">
        <div className="flex min-w-0 flex-col gap-10">
          <Seccion icon={<BookOpen size={18} className="text-green-800" />} titulo="Sobre este cultivo">
            {cultivo.descripcion ? (
              <p className="m-0 text-base leading-relaxed text-pretty text-fg-1">{cultivo.descripcion}</p>
            ) : (
              <Vacio>Este cultivo todavía no tiene cargada su descripción.</Vacio>
            )}
          </Seccion>

          <Seccion
            icon={<CalendarDays size={18} className="text-green-800" />}
            titulo="Estacionalidad"
            sub="Calendario de cosecha, crecimiento y reposo a lo largo del año en Mendoza."
          >
            {cultivo.calendario.length === 0 ? (
              <Vacio>Este cultivo todavía no tiene cargado su calendario de estacionalidad.</Vacio>
            ) : (
              <Card className="px-6 py-[22px]">
                <CalendarioTemporada calendario={cultivo.calendario} />
              </Card>
            )}
          </Seccion>
        </div>

        <NutricionCard cultivo={cultivo} />
      </div>

      {/* TODO backend: el detalle también manda `recetas`; falta wirear la
          pantalla de recetas, que todavía sale de los mocks. */}

      <Seccion
        className="mt-12"
        icon={<Tractor size={18} className="text-green-800" />}
        titulo="Actividades en las que podés cosecharlo"
        sub={cultivo.actividades.length > 0
          ? "Sumate a una experiencia en finca para cosechar este cultivo con sus productores."
          : undefined}
      >
        {cultivo.actividades.length === 0 ? (
          <Vacio>Por ahora no hay actividades publicadas para cosechar este cultivo.</Vacio>
        ) : (
          <div className="grid grid-cols-1 gap-5 min-[681px]:grid-cols-2 min-[1041px]:grid-cols-3">
            {cultivo.actividades.map((a) => <ActividadCard key={a.id} actividad={a} />)}
          </div>
        )}
      </Seccion>
    </>
  );
}

/* ---- Pantalla ------------------------------------------------------------ */

export default function DetalleClient({ id }: { id: string }) {
  const { data, isLoading, error, reload } = useCultivoDetalle(id);

  return (
    <div className="mx-auto max-w-[1160px] px-7 pt-7 pb-20">
      <div className="mb-3.5 flex items-center gap-2.5 text-[13px] text-fg-3">
        <Link href="/" className="text-fg-3 no-underline">Inicio</Link>
        <ChevronRight size={14} />
        <Link href="/cultivos" className="text-fg-3 no-underline">Cultivos</Link>
        <ChevronRight size={14} />
        <span className="font-medium text-fg-2">{data?.nombre ?? "Detalle"}</span>
      </div>

      <Link href="/cultivos" className="mb-[18px] inline-flex items-center gap-[7px] text-sm font-semibold text-green-800 no-underline">
        <ArrowLeft size={16} /> Volver a cultivos
      </Link>

      <AsyncBoundary loading={isLoading} error={error} onRetry={reload} skeleton={<DetalleSkeleton />}>
        {/* `data` en null es un id que no existe, no una falla de la lectura. */}
        {data ? <Detalle cultivo={data} /> : <NoEncontrado />}
      </AsyncBoundary>
    </div>
  );
}
