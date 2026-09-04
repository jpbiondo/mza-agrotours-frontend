"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle, CalendarDays, CalendarPlus, Check, Clock, Eye, EyeOff, FilePenLine,
  Grape, LayoutGrid, Leaf, Loader, MapPin, Nut, Cherry, Plus, RotateCcw, Scissors, Search,
  SearchX, Settings2, SlidersHorizontal, Sprout, Trash2, Wine, X,
} from "lucide-react";
import AsyncBoundary from "@/components/AsyncBoundary";
import { Pagination } from "@/components/catalog/controls";
import { Alert, Button, Card, Modal, Skeleton, Toast } from "@/components/ui";
import { buttonClasses } from "@/components/ui/Button";
import type { ToastData } from "@/components/ui";
import { iconoDeCultivos, normalizar } from "@/data/actividades-prod";
import { useEstablecimientos } from "@/hooks/useEstablecimientos";
import { useActividades, useActividadAcciones } from "@/hooks/useActividades";
import { moneyAr } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ActividadProd, EstadoActividad } from "@/types/actividad-prod";

const PAGE_SIZE = 10;

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  grape: Grape, scissors: Scissors, wine: Wine, leaf: Leaf, cherry: Cherry,
  sprout: Sprout, nut: Nut, "map-pin": MapPin,
};

type Override = Partial<Pick<ActividadProd, "estado">>;

/* ---- Piezas chicas ------------------------------------------------------ */

function CropChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-pill bg-green-100 px-[11px] py-1 text-[12.5px] leading-tight font-semibold text-green-800">
      <Sprout className="size-3 text-green-700" /> {children}
    </span>
  );
}

function CardAction({
  icon, label, href, onClick, danger,
}: {
  icon: React.ReactNode;
  label: string;
  href?: string;
  onClick?: () => void;
  danger?: boolean;
}) {
  const clase = cn(
    "inline-flex cursor-pointer items-center gap-[7px] rounded-md border border-sand bg-surface px-3.5 py-2.5 text-[13.5px] font-semibold whitespace-nowrap no-underline transition-colors hover:bg-cream-tert",
    danger ? "text-danger-fg shadow-[inset_0_-2px_0_var(--danger-fill)]" : "text-fg-1 shadow-[inset_0_-2px_0_var(--outline)]",
  );
  if (href) return <Link href={href} className={clase}>{icon} {label}</Link>;
  return <button type="button" onClick={onClick} className={clase}>{icon} {label}</button>;
}

/* ---- Toggle Borrador / Publicar ----------------------------------------- */
function PublishToggle({
  act, busy, onPublicar, onBorrador,
}: {
  act: ActividadProd;
  busy: boolean;
  onPublicar: () => void;
  onBorrador: () => void;
}) {
  const publicada = act.estado === "publicado";
  // Mientras el listado no traiga las reservas esto queda siempre en 0 y el
  // botón nunca se bloquea; el backend es el que tiene que rechazar el cambio.
  const reservas = act.reservas ?? 0;
  const sinBorrador = reservas > 0;

  const seg = (activo: boolean, deshabilitado: boolean) =>
    cn(
      "inline-flex items-center gap-1.5 rounded-pill border-none px-[13px] py-1.5 text-[13px] font-semibold whitespace-nowrap transition-colors",
      activo ? "bg-green-800 text-fg-on-dark" : "text-fg-2",
      deshabilitado ? "cursor-not-allowed opacity-40" : activo ? "cursor-default" : "cursor-pointer",
    );

  return (
    <div className="flex flex-col items-end gap-1">
      <div
        role="group"
        aria-label="Estado de publicación"
        className="inline-flex gap-[3px] rounded-pill border border-outline-variant bg-cream-tert p-[3px]"
      >
        <button
          type="button"
          className={seg(!publicada, sinBorrador || busy)}
          disabled={sinBorrador || busy}
          title={sinBorrador ? "No se puede ocultar: tiene reservas asociadas" : "Ocultar (guardar como borrador)"}
          onClick={() => { if (!sinBorrador && publicada) onBorrador(); }}
        >
          <EyeOff className="size-[13px]" /> Borrador
        </button>
        <button
          type="button"
          className={seg(publicada, busy)}
          disabled={busy}
          title="Publicar (visible para visitantes)"
          onClick={() => { if (!publicada) onPublicar(); }}
        >
          <Eye className="size-[13px]" /> Publicar
        </button>
      </div>
      {sinBorrador && (
        <span className="text-[11.5px] text-fg-3">
          {reservas} {reservas === 1 ? "reserva asociada" : "reservas asociadas"}
        </span>
      )}
    </div>
  );
}

/* ---- Tarjeta de actividad ----------------------------------------------- */
function ActivityCard({
  act, busy, onEliminar, onPublicar, onBorrador,
}: {
  act: ActividadProd;
  busy: boolean;
  onEliminar: () => void;
  onPublicar: () => void;
  onBorrador: () => void;
}) {
  const IconC = ICONS[iconoDeCultivos(act.cultivos)] ?? Grape;

  return (
    <Card className="overflow-hidden p-0">
      <div className="flex flex-wrap items-start gap-5 p-6">
        <div className="flex size-[54px] shrink-0 items-center justify-center rounded-[14px] border border-outline-variant bg-green-050">
          <IconC className="size-[26px] text-green-700" />
        </div>

        <div className="min-w-60 flex-[1_1_280px]">
          <div className="flex flex-wrap items-center gap-2.5">
            <h3 className="font-display text-[19px] font-semibold text-fg-1">{act.nombre}</h3>
            <span className="font-mono text-[11.5px] text-fg-3">{act.id}</span>
          </div>

          <div className="mt-3.5">
            <div className="t-label mb-[7px]">Cultivos asociados</div>
            <div className="flex flex-wrap gap-[7px]">
              {act.cultivos.length === 0 ? (
                <span className="text-[13px] text-fg-3">Sin cultivos asociados.</span>
              ) : (
                act.cultivos.map((c) => <CropChip key={c.id}>{c.nombre}</CropChip>)
              )}
            </div>
          </div>

          <div className="mt-4 flex items-baseline gap-2">
            <span className="t-label">Precio regular</span>
            <span className="font-mono text-lg font-semibold text-fg-1">{moneyAr(act.precio)}</span>
            <span className="text-[12.5px] text-fg-3">por persona</span>
          </div>
        </div>

        <div className="flex min-w-[220px] flex-[1_1_240px] flex-col items-start gap-3">
          <div className="self-end">
            <PublishToggle act={act} busy={busy} onPublicar={onPublicar} onBorrador={onBorrador} />
          </div>

          <div className="w-full">
            <div className="t-label mb-2 flex items-center gap-[7px]">
              <Clock className="size-3.5 text-fg-2" /> Días y horas disponibles
            </div>
            {act.dias.length === 0 ? (
              <p className="text-[13px] text-fg-3">Sin días cargados.</p>
            ) : (
              <ul className="flex flex-col gap-1.5">
                {act.dias.map((d, i) => (
                  <li
                    key={i}
                    className={cn(
                      "flex items-baseline justify-between gap-3 text-sm text-fg-1",
                      i < act.dias.length - 1 && "border-b border-cream-tert pb-1.5",
                    )}
                  >
                    <span className="font-semibold">{d.dia}</span>
                    {d.desde && (
                      <span className="font-mono text-[13px] text-fg-2">
                        {d.desde} – {d.hasta}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap justify-end gap-2.5 border-t border-outline-variant bg-cream-tert px-6 py-3.5">
        <CardAction icon={<Settings2 className="size-[15px] text-fg-2" />} label="Modificar" href={`/panel/actividades/${act.id}/editar`} />
        <CardAction icon={<CalendarPlus className="size-[15px] text-fg-2" />} label="Agregar día" href={`/panel/actividades/${act.id}/editar`} />
        <CardAction icon={<CalendarDays className="size-[15px] text-fg-2" />} label="Ver calendario" href={`/panel/actividades/${act.id}/calendario`} />
        <CardAction icon={<Trash2 className="size-[15px] text-danger" />} label="Eliminar" danger onClick={onEliminar} />
      </div>
    </Card>
  );
}

/* ---- Selector de estado ------------------------------------------------- */
function EstadoSelector({
  value, onChange, counts,
}: {
  value: string;
  onChange: (v: "todas" | EstadoActividad) => void;
  counts: Record<string, number>;
}) {
  const opciones: { value: "todas" | EstadoActividad; label: string; icon: React.ReactNode }[] = [
    { value: "todas", label: "Todas", icon: <LayoutGrid className="size-[15px]" /> },
    { value: "borrador", label: "Borrador", icon: <FilePenLine className="size-[15px]" /> },
    { value: "publicado", label: "Publicado", icon: <Eye className="size-[15px]" /> },
  ];
  return (
    <div
      role="group"
      aria-label="Filtrar por estado"
      className="inline-flex flex-wrap gap-1 rounded-pill border border-outline-variant bg-cream-tert p-1"
    >
      {opciones.map((o) => {
        const sel = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={sel}
            onClick={() => onChange(o.value)}
            className={cn(
              "inline-flex items-center gap-[7px] rounded-pill px-3.5 py-2 text-[13.5px] font-semibold whitespace-nowrap transition-colors",
              sel ? "cursor-default bg-green-800 text-fg-on-dark" : "cursor-pointer text-fg-2 hover:bg-surface",
            )}
          >
            <span className={cn("inline-flex", sel ? "text-fg-on-dark" : "text-fg-3")}>{o.icon}</span>
            {o.label}
            <span
              className={cn(
                "min-w-5 rounded-pill px-1.5 py-px text-center font-mono text-[11.5px] font-bold",
                sel ? "bg-white/20 text-fg-on-dark" : "border border-outline-variant bg-surface text-fg-2",
              )}
            >
              {counts[o.value] ?? 0}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/* ---- Esqueleto ---------------------------------------------------------- */
function ListadoSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-busy>
      {Array.from({ length: 3 }, (_, i) => (
        <Card key={i} className="p-6">
          <div className="flex flex-wrap items-start gap-5">
            <Skeleton className="size-[54px] rounded-[14px]" />
            <div className="min-w-60 flex-[1_1_280px]">
              <Skeleton className="h-5 w-64" />
              <Skeleton className="mt-4 h-6 w-44 rounded-pill" />
              <Skeleton className="mt-4 h-6 w-52" />
            </div>
            <div className="min-w-[220px] flex-[1_1_240px]">
              <Skeleton className="ml-auto h-9 w-52 rounded-pill" />
              <Skeleton className="mt-4 h-4 w-full" />
              <Skeleton className="mt-2 h-4 w-3/4" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

/* ---- Cliente ------------------------------------------------------------ */
export default function ActividadesClient() {
  // El establecimiento activo lo elige el switcher del shell.
  const { activo } = useEstablecimientos();
  const establecimientoId = activo?.id ?? "";
  const { data, isLoading, error, reload } = useActividades(establecimientoId);
  const { darDeBaja, cambiarEstado, pendingId } = useActividadAcciones();

  // Las acciones todavía no persisten: el override deja ver el resultado en la
  // tarjeta sin volver a pedir el listado. Se descarta al recargar.
  const [overrides, setOverrides] = useState<Record<string, Override>>({});
  // Las dadas de baja no vuelven en el listado, así que se sacan de la vista.
  const [eliminadas, setEliminadas] = useState<Set<string>>(() => new Set());
  const [query, setQuery] = useState("");
  const [estadoF, setEstadoF] = useState<"todas" | EstadoActividad>("todas");
  const [page, setPage] = useState(1);
  const [toDelete, setToDelete] = useState<ActividadProd | null>(null);
  const [blocked, setBlocked] = useState<ActividadProd | null>(null);
  const [toast, setToast] = useState<ToastData | null>(null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4800);
    return () => clearTimeout(t);
  }, [toast]);

  const acts = useMemo(
    () =>
      (data ?? [])
        .filter((a) => !eliminadas.has(a.id))
        .map((a) => (overrides[a.id] ? { ...a, ...overrides[a.id] } : a)),
    [data, overrides, eliminadas],
  );

  const counts = useMemo(() => {
    const c: Record<string, number> = { todas: acts.length, borrador: 0, publicado: 0 };
    acts.forEach((a) => { c[a.estado]++; });
    return c;
  }, [acts]);

  const filtradas = useMemo(() => {
    let arr = acts;
    if (estadoF !== "todas") arr = arr.filter((a) => a.estado === estadoF);
    const q = normalizar(query.trim());
    if (q) arr = arr.filter((a) => normalizar(a.nombre).includes(q));
    return arr;
  }, [acts, query, estadoF]);

  const pages = Math.max(1, Math.ceil(filtradas.length / PAGE_SIZE));
  const pageSafe = Math.min(page, pages);
  const visibles = filtradas.slice((pageSafe - 1) * PAGE_SIZE, pageSafe * PAGE_SIZE);

  const pedirBaja = (act: ActividadProd) => {
    if ((act.reservasPagadas ?? 0) > 0) setBlocked(act);
    else setToDelete(act);
  };

  async function confirmDelete(act: ActividadProd) {
    await darDeBaja(act.id);
    setEliminadas((s) => new Set(s).add(act.id));
    setToDelete(null);
    setToast({ tone: "success", title: "La actividad se dio de baja correctamente.", sub: `«${act.nombre}»` });
  }

  async function setEstado(act: ActividadProd, nuevo: EstadoActividad) {
    await cambiarEstado(act.id, nuevo);
    setOverrides((o) => ({ ...o, [act.id]: { ...o[act.id], estado: nuevo } }));
    setToast({
      tone: "success",
      title: nuevo === "publicado" ? "La actividad se publicó correctamente." : "La actividad se ocultó correctamente.",
      sub: `«${act.nombre}» · estado ${nuevo === "publicado" ? "Publicado" : "Borrador"}.`,
    });
  }

  const sinActividades = !isLoading && !error && acts.length === 0;

  return (
    <div className="min-h-screen bg-cream-bg">
      <div className="mx-auto max-w-[1240px] px-7 pt-7 pb-[72px]">
        <div className="mb-1.5 flex flex-wrap items-end justify-between gap-4">
          <div>
            {activo && (
              <div className="mb-1.5 flex items-center gap-2 text-[13px] text-fg-3">
                {/* TODO backend: la ubicación todavía no viaja en los accesos. */}
                <MapPin className="size-3.5 text-brown-700" /> <span>{activo.nombre} · Mendoza, Argentina</span>
              </div>
            )}
            <h1 className="font-display text-[32px] font-bold tracking-[-.01em] text-fg-1">
              Actividades del establecimiento
            </h1>
            <p className="mt-1.5 text-[15px] text-fg-2">
              Gestioná las experiencias que ofrecés y revisá su disponibilidad.
            </p>
          </div>
          <Link href="/panel/actividades/crear" className={buttonClasses()}>
            <Plus className="size-[17px]" /> Crear actividad
          </Link>
        </div>

        <div className="mt-[22px] mb-6 h-px bg-outline-variant" />

        {!establecimientoId && (
          <Alert className="mb-5">
            No hay un establecimiento seleccionado. Elegí uno en el menú lateral para ver sus
            actividades.
          </Alert>
        )}

        <AsyncBoundary
          loading={isLoading}
          error={error}
          onRetry={reload}
          loadingLabel="Cargando actividades…"
          skeleton={<ListadoSkeleton />}
          pad={72}
        >
          {sinActividades ? (
            <Card className="border-dashed border-sand px-8 py-16 text-center">
              <div className="mb-5 inline-flex size-[72px] items-center justify-center rounded-full border border-green-100 bg-green-050">
                <Grape className="size-[34px] text-green-700" />
              </div>
              <h2 className="mb-2 font-display text-2xl font-bold text-fg-1">
                Todavía no hay actividades
              </h2>
              <p className="mx-auto mb-6 max-w-[420px] text-[15.5px] leading-relaxed text-fg-2">
                Empezá creando la primera experiencia para tus visitantes.
              </p>
              <Link href="/panel/actividades/crear" className={buttonClasses()}>
                <Plus className="size-[18px]" /> Crear actividad
              </Link>
            </Card>
          ) : (
            <>
              <div className="mb-6 flex flex-wrap items-center gap-4">
                <div className="relative max-w-[460px] min-w-[280px] flex-1">
                  <Search className="pointer-events-none absolute top-1/2 left-3.5 size-[18px] -translate-y-1/2 text-fg-3" />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => { setQuery(e.target.value); setPage(1); }}
                    placeholder="Buscá por nombre de actividad…"
                    aria-label="Buscar actividad"
                    className="h-11 w-full rounded-md border border-sand bg-surface pr-10 pl-[42px] text-[14.5px] text-fg-1 outline-none transition-colors placeholder:text-fg-3 focus-visible:border-green-800 focus-visible:ring-3 focus-visible:ring-green-800/20"
                  />
                  {query && (
                    <button
                      type="button"
                      onClick={() => { setQuery(""); setPage(1); }}
                      aria-label="Limpiar búsqueda"
                      className="absolute top-1/2 right-2.5 -translate-y-1/2 cursor-pointer p-1 text-fg-3 hover:text-fg-2"
                    >
                      <X className="size-4" />
                    </button>
                  )}
                </div>
                <div className="text-[13.5px] text-fg-2">
                  <strong className="font-semibold text-fg-1">{filtradas.length}</strong>{" "}
                  {filtradas.length === 1 ? "actividad" : "actividades"}
                  {query ? " encontradas" : ""}
                </div>
              </div>

              <div className="mb-[22px] flex flex-wrap items-center gap-3">
                <span className="t-label inline-flex items-center gap-[7px]">
                  <SlidersHorizontal className="size-3.5 text-fg-2" /> Estado
                </span>
                <EstadoSelector
                  value={estadoF}
                  onChange={(v) => { setEstadoF(v); setPage(1); }}
                  counts={counts}
                />
              </div>

              {filtradas.length === 0 ? (
                <Card className="px-8 py-14 text-center">
                  <div className="mb-[18px] inline-flex size-[60px] items-center justify-center rounded-full bg-cream-tert">
                    <SearchX className="size-7 text-fg-3" />
                  </div>
                  <h3 className="mb-1.5 font-display text-xl font-bold text-fg-1">Sin coincidencias</h3>
                  <p className="mx-auto mb-5 max-w-[380px] text-[15px] text-fg-2">
                    No hay actividades para los filtros elegidos.
                  </p>
                  <Button
                    variant="neutral"
                    onClick={() => { setQuery(""); setEstadoF("todas"); setPage(1); }}
                  >
                    <RotateCcw className="size-[17px]" /> Limpiar filtros
                  </Button>
                </Card>
              ) : (
                <div className="flex flex-col gap-4">
                  {visibles.map((act) => (
                    <ActivityCard
                      key={act.id}
                      act={act}
                      busy={pendingId === act.id}
                      onEliminar={() => pedirBaja(act)}
                      onPublicar={() => setEstado(act, "publicado")}
                      onBorrador={() => setEstado(act, "borrador")}
                    />
                  ))}
                </div>
              )}

              <Pagination page={pageSafe} pages={pages} onPage={setPage} />
            </>
          )}
        </AsyncBoundary>
      </div>

      {toDelete && (
        <Modal onClose={() => setToDelete(null)} dismissable={pendingId !== toDelete.id}>
          <div className="flex gap-4">
            <div className="flex size-[46px] shrink-0 items-center justify-center rounded-full bg-danger-fill">
              <Trash2 className="size-[22px] text-danger" />
            </div>
            <div className="flex-1">
              <h3 className="mb-1.5 font-display text-[19px] font-bold text-fg-1">
                ¿Querés dar de baja esta actividad?
              </h3>
              <p className="text-[14.5px] leading-relaxed text-fg-2">
                Vas a dar de baja «<strong className="text-fg-1">{toDelete.nombre}</strong>». Dejará
                de mostrarse al público y no podrán hacerse nuevas reservas. Esta acción no se puede
                deshacer.
              </p>
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <Button variant="neutral" onClick={() => setToDelete(null)} disabled={pendingId === toDelete.id}>
              Cancelar
            </Button>
            <Button variant="danger" onClick={() => confirmDelete(toDelete)} disabled={pendingId === toDelete.id}>
              {pendingId === toDelete.id ? (
                <><Loader className="spin size-4" /> Dando de baja…</>
              ) : (
                <><Check className="size-[17px]" /> Confirmar</>
              )}
            </Button>
          </div>
        </Modal>
      )}

      {blocked && (
        <Modal onClose={() => setBlocked(null)}>
          <div className="flex gap-4">
            <div className="flex size-[46px] shrink-0 items-center justify-center rounded-full bg-warning-fill">
              <AlertTriangle className="size-[22px] text-warning" />
            </div>
            <div className="flex-1">
              <h3 className="mb-2 font-display text-[19px] font-bold text-fg-1">
                No es posible eliminar esta actividad
              </h3>
              <p className="text-[14.5px] leading-relaxed text-fg-2">
                «<strong className="text-fg-1">{blocked.nombre}</strong>» tiene reservas en estado
                «<strong className="text-fg-1">Pagado</strong>». Pasá todas las reservas a
                «Cancelado con reembolso» y gestioná los reembolsos antes de darla de baja.
              </p>
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <Button variant="neutral" onClick={() => setBlocked(null)}>Cerrar</Button>
            <Link href="/panel/reservas" className={buttonClasses()}>
              <CalendarDays className="size-[17px]" /> Ver reservas
            </Link>
          </div>
        </Modal>
      )}

      {toast && <Toast {...toast} />}
    </div>
  );
}
