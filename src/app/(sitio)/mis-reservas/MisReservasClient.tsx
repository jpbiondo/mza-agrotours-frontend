"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search, X, List, Clock, CheckCircle2, XCircle, ChevronRight, CalendarDays,
  Users, MapPin, ArrowRight, CalendarX, SearchX, RotateCcw, Compass, Loader,
} from "lucide-react";
import Photo, { seedDeId } from "@/components/landing/Photo";
import AsyncBoundary from "@/components/AsyncBoundary";
import { EstadoBadge, Skeleton } from "@/components/ui";
import { metaEstadoReserva } from "@/data/reservas";
import { moneyAr } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useReservas } from "@/hooks/useReservas";
import type { CategoriaReserva, ReservaResumen } from "@/types/reservas";

type FilterId = "todas" | CategoriaReserva;

const FILTERS: { id: FilterId; label: string; icon: React.ReactNode }[] = [
  { id: "todas", label: "Todas", icon: <List size={15} /> },
  { id: "activa", label: "Activas", icon: <Clock size={15} /> },
  { id: "finalizada", label: "Finalizadas", icon: <CheckCircle2 size={15} /> },
  { id: "cancelada", label: "Canceladas", icon: <XCircle size={15} /> },
];

const p2 = (n: number) => String(n).padStart(2, "0");
const fmtDia = (d: Date) => `${p2(d.getDate())}/${p2(d.getMonth() + 1)}/${d.getFullYear()}`;
const fmtHora = (d: Date) => `${p2(d.getHours())}:${p2(d.getMinutes())}`;

function horario(r: ReservaResumen): string | undefined {
  if (!r.inicio) return undefined;
  return r.fin ? `${fmtHora(r.inicio)} — ${fmtHora(r.fin)}` : fmtHora(r.inicio);
}

function MetaItem({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub?: string }) {
  return (
    <div className="flex min-w-0 items-start gap-[9px]">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-cream-tert text-green-800">{icon}</div>
      <div className="min-w-0 leading-[1.2]">
        <div className="text-[10.5px] font-semibold tracking-[.08em] text-fg-3 uppercase">{label}</div>
        <div className="mt-[3px] truncate text-[13.5px] font-medium text-fg-1">{value}</div>
        {sub && <div className="mt-0.5 truncate text-xs text-fg-2">{sub}</div>}
      </div>
    </div>
  );
}

function ReservaCard({ r }: { r: ReservaResumen }) {
  const meta = metaEstadoReserva(r.estado);
  return (
    <Link
      href={`/mis-reservas/${r.id}`}
      className="flex items-stretch overflow-hidden rounded-lg border border-outline-variant bg-surface no-underline transition-[box-shadow,border-color,transform] duration-150 hover:-translate-y-0.5 hover:border-sand hover:shadow-[var(--shadow-hover)]"
    >
      {/* TODO backend: ListarReservaDTO todavía no trae fotos; mientras, el degradado por id. */}
      <div className="hidden w-[220px] shrink-0 sm:block">
        <Photo seed={seedDeId(r.actividadId || r.id)} height="100%" radius={0} />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-2.5 px-[22px] py-[18px]">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="mb-1 truncate font-mono text-[11.5px] tracking-[.04em] text-fg-3">{r.id}</div>
            <h3 className="font-display text-[19px] leading-[1.2] font-semibold text-fg-1">
              {r.actividad || "Actividad sin nombre"}
            </h3>
          </div>
          <EstadoBadge tone={meta.tone}>{r.estado || "Sin estado"}</EstadoBadge>
        </div>

        <div className="mt-1 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <MetaItem icon={<CalendarDays size={15} />} label="Fecha" value={r.inicio ? fmtDia(r.inicio) : "—"} sub={horario(r)} />
          <MetaItem icon={<Users size={15} />} label="Personas" value={`${r.personas} ${r.personas === 1 ? "persona" : "personas"}`} />
          <MetaItem icon={<MapPin size={15} />} label="Ubicación" value={r.establecimiento || "—"} sub={r.ubicacion || undefined} />
        </div>

        <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-cream-tert pt-3">
          <div className="text-[12.5px] text-fg-3">
            Total <span className="ml-1 font-mono text-sm font-semibold text-green-800">{moneyAr(r.total)}</span>
          </div>
          <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-fg-1">
            Ver detalle <ArrowRight size={15} />
          </span>
        </div>
      </div>
    </Link>
  );
}

/** Misma caja que `ReservaCard`, para que la lista no salte al llegar los datos. */
function ListaSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-[18px]">
      {Array.from({ length: 3 }, (_, i) => (
        <div key={i} className="flex overflow-hidden rounded-lg border border-outline-variant bg-surface">
          <Skeleton className="hidden h-[190px] w-[220px] shrink-0 rounded-none sm:block" />
          <div className="flex min-w-0 flex-1 flex-col gap-3 px-[22px] py-[18px]">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <Skeleton className="h-3 w-40" />
                <Skeleton className="mt-2 h-5 w-[60%]" />
              </div>
              <Skeleton className="h-6 w-20 rounded-pill" />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {Array.from({ length: 3 }, (_, j) => <Skeleton key={j} className="h-8" />)}
            </div>
            <Skeleton className="mt-auto h-4 w-32" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ icon, title, sub, action }: { icon: React.ReactNode; title: string; sub: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-sand bg-surface px-6 py-16 text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-cream-tert text-brown-700">{icon}</div>
      <div className="font-display text-xl font-semibold text-fg-1">{title}</div>
      <div className="max-w-[440px] text-[14.5px] leading-normal text-fg-2">{sub}</div>
      {action}
    </div>
  );
}

export default function MisReservasClient() {
  const router = useRouter();
  const { reservas, isLoading, error, unauthenticated, reload } = useReservas();
  const [filter, setFilter] = useState<FilterId>("todas");
  const [query, setQuery] = useState("");
  const [applied, setApplied] = useState("");

  // Ruta protegida: sin sesión, a la pantalla de login.
  useEffect(() => {
    if (unauthenticated) router.replace("/acceso");
  }, [unauthenticated, router]);

  const afterSearch = useMemo(() => {
    const q = applied.trim().toLowerCase();
    if (!q) return reservas;
    return reservas.filter((r) =>
      [r.actividad, r.establecimiento, r.ubicacion, r.id].some((f) => f.toLowerCase().includes(q)),
    );
  }, [applied, reservas]);

  const counts = useMemo(() => {
    const c: Record<FilterId, number> = { todas: afterSearch.length, activa: 0, finalizada: 0, cancelada: 0 };
    for (const r of afterSearch) c[metaEstadoReserva(r.estado).categoria]++;
    return c;
  }, [afterSearch]);

  const visible = useMemo(
    () => (filter === "todas" ? afterSearch : afterSearch.filter((r) => metaEstadoReserva(r.estado).categoria === filter)),
    [afterSearch, filter],
  );

  const searchEnabled = query.trim().length > 4;
  const limpiar = () => { setQuery(""); setApplied(""); setFilter("todas"); };

  if (unauthenticated) {
    return (
      <div className="px-7 py-[120px] text-center text-fg-3">
        <Loader size={26} className="spin mx-auto" />
        <div className="mt-3 text-sm">Redirigiendo…</div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1160px] px-7 pt-10 pb-20">
      <div className="mb-8">
        <div className="mb-2.5 flex items-center gap-2.5 text-[13px] text-fg-3">
          <Link href="/" className="text-fg-3 no-underline">Inicio</Link>
          <ChevronRight size={14} />
          <span className="font-medium text-fg-2">Mis reservas</span>
        </div>
        <h1 className="font-display text-4xl font-bold tracking-[-.01em] text-fg-1">Mis reservas</h1>
        <p className="mt-2.5 max-w-[600px] text-[15.5px] text-fg-2">
          Acá vas a encontrar las experiencias que reservaste en fincas mendocinas. Consultá su estado, descargá el comprobante y revisá los detalles.
        </p>
      </div>

      <div className="mb-7 flex flex-col gap-[18px] rounded-lg border border-outline-variant bg-surface p-5">
        <div className="flex max-w-[720px] items-stretch gap-2.5">
          <div className="relative flex-1">
            <Search size={18} className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-fg-3" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && searchEnabled) setApplied(query); }}
              placeholder="Buscar por nombre de la actividad, finca o ubicación…"
              aria-label="Buscar reservas"
              className="w-full rounded-[var(--radius)] border border-sand bg-surface py-[11px] pr-[13px] pl-[42px] font-sans text-[14.5px] text-fg-1 outline-none"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Limpiar"
                className="absolute top-1/2 right-2.5 flex size-[26px] -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border-none bg-cream-tert text-fg-2"
              >
                <X size={14} />
              </button>
            )}
          </div>
          <button type="button" className="btn btn-primary" disabled={!searchEnabled} onClick={() => setApplied(query)}>
            <Search size={16} /> Buscar
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((f) => {
              const on = filter === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFilter(f.id)}
                  aria-pressed={on}
                  className={cn(
                    "inline-flex cursor-pointer items-center gap-2 rounded-full border px-4 py-2.5 font-sans text-[13.5px] font-semibold",
                    on ? "border-green-800 bg-green-800 text-white" : "border-sand bg-surface text-fg-2",
                  )}
                >
                  <span className={cn("inline-flex", on ? "text-white" : "text-fg-3")}>{f.icon}</span>
                  {f.label}
                  <span className={cn("ml-0.5 rounded-full px-2 py-0.5 font-mono text-[11.5px] font-bold", on ? "bg-white/20 text-white" : "bg-cream-tert text-fg-3")}>
                    {isLoading ? "–" : counts[f.id]}
                  </span>
                </button>
              );
            })}
          </div>
          {applied && (
            <div className="flex items-center gap-2.5 text-[13.5px] text-fg-2">
              <span>Buscando:&nbsp;<strong className="text-fg-1">“{applied}”</strong></span>
              <button type="button" onClick={() => { setQuery(""); setApplied(""); }} className="cursor-pointer border-none bg-transparent px-1.5 py-1 text-[13.5px] font-semibold text-green-800">
                Limpiar búsqueda
              </button>
            </div>
          )}
        </div>
      </div>

      <AsyncBoundary loading={isLoading} error={error} onRetry={reload} skeleton={<ListaSkeleton />} pad={72}>
        {reservas.length === 0 ? (
          <EmptyState
            icon={<CalendarX size={28} />}
            title="Todavía no tenés reservas"
            sub="Cuando reserves tu primera experiencia en una finca de Mendoza, vas a verla acá."
            action={<Link href="/explorar" className="btn btn-primary mt-2"><Compass size={18} /> Explorar experiencias</Link>}
          />
        ) : visible.length === 0 ? (
          <EmptyState
            icon={<SearchX size={28} />}
            title="No se encontraron reservas relacionadas"
            sub={applied
              ? <>No hay reservas que coincidan con <strong className="text-fg-1">“{applied}”</strong>{filter !== "todas" ? " en el estado seleccionado" : null}. Probá con otro término o limpiá los filtros.</>
              : "No hay reservas en este estado."}
            action={<button type="button" className="btn btn-neutral mt-2" onClick={limpiar}><RotateCcw size={17} /> Limpiar filtros</button>}
          />
        ) : (
          <>
            <div className="mb-3.5 text-[13.5px] text-fg-3">
              Mostrando <strong className="text-fg-2">{visible.length}</strong> {visible.length === 1 ? "reserva" : "reservas"}
            </div>
            {/* Ordenadas en el hook: próximas primero, después las pasadas. */}
            <div className="grid grid-cols-1 gap-[18px]">
              {visible.map((r) => <ReservaCard key={r.id} r={r} />)}
            </div>
          </>
        )}
      </AsyncBoundary>
    </div>
  );
}
