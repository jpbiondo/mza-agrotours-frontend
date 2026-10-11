"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronRight, ArrowLeft, MapPin, Download, ReceiptText, CalendarDays, Clock, Users,
  SearchX, Loader, XCircle,
} from "lucide-react";
import Photo, { seedDeId } from "@/components/landing/Photo";
import AsyncBoundary from "@/components/AsyncBoundary";
import { Button, EstadoBadge, Skeleton } from "@/components/ui";
import { metaEstadoReserva } from "@/data/reservas";
import { fmtDiaLocal, fmtFranja, moneyAr } from "@/lib/format";
import { useReserva } from "@/hooks/useReservas";
import type { ReservaDetalle } from "@/types/reservas";
import { descargarComprobante } from "./comprobante";
import CancelarReservaModal from "./CancelarReservaModal";

function MetaItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex min-w-0 items-start gap-[9px]">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-cream-tert text-green-800">{icon}</div>
      <div className="min-w-0 leading-[1.2]">
        <div className="text-[10.5px] font-semibold tracking-[.08em] text-fg-3 uppercase">{label}</div>
        <div className="mt-[3px] text-[13.5px] font-medium text-fg-1">{value}</div>
      </div>
    </div>
  );
}

function Bloque({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <section className="overflow-hidden rounded-lg border border-outline-variant bg-surface">
      <div className="flex items-center gap-2.5 border-b border-cream-tert px-[22px] py-4">
        <div className="flex size-8 items-center justify-center rounded-lg bg-green-050 text-green-800">{icon}</div>
        <h2 className="font-display text-[17px] font-semibold text-fg-1">{title}</h2>
      </div>
      <div className="p-[22px]">{children}</div>
    </section>
  );
}

function Cabecera({ r, onCancelar }: { r: ReservaDetalle; onCancelar?: () => void }) {
  const meta = metaEstadoReserva(r.estado);
  return (
    <div className="mb-6 overflow-hidden rounded-lg border border-outline-variant bg-surface">
      <div className="relative">
        {/* TODO backend: ConsultarReservaDTO todavía no trae fotos; mientras, el degradado por actividad. */}
        <Photo seed={seedDeId(r.actividadId || r.id)} height={150} radius={0} />
        <span className="absolute top-3.5 left-4 max-w-[calc(100%-32px)] truncate rounded-full bg-black/35 px-2.5 py-1 font-mono text-xs tracking-[.04em] text-white">
          {r.id}
        </span>
      </div>
      <div className="flex flex-wrap items-start justify-between gap-6 px-6 pt-5 pb-[22px]">
        <div className="min-w-[240px] flex-1">
          <div className="mb-2.5">
            <EstadoBadge tone={meta.tone}>{r.estado || "Sin estado"}</EstadoBadge>
          </div>
          {r.actividadId ? (
            <Link href={`/explorar/${r.actividadId}`} className="font-display text-[25px] leading-[1.2] font-bold text-green-800 no-underline hover:underline">
              {r.actividad || "Actividad sin nombre"}
            </Link>
          ) : (
            <span className="font-display text-[25px] leading-[1.2] font-bold text-fg-1">{r.actividad || "Actividad sin nombre"}</span>
          )}
          <div className="mt-2.5 flex flex-wrap items-center gap-[7px] text-[14.5px] text-fg-2">
            <MapPin size={16} className="text-brown-700" />
            {r.establecimientoId ? (
              <Link href={`/establecimientos/${r.establecimientoId}`} className="font-semibold text-green-800 no-underline hover:underline">
                {r.establecimiento || "Establecimiento"}
              </Link>
            ) : (
              <span className="font-semibold text-fg-1">{r.establecimiento || "—"}</span>
            )}
            {r.ubicacion && <span className="text-fg-3">· {r.ubicacion}</span>}
          </div>
        </div>
        <div className="flex flex-wrap items-start gap-2.5">
          <button type="button" className="btn btn-neutral" onClick={() => descargarComprobante(r)}>
            <Download size={17} /> Descargar comprobante
          </button>
          {onCancelar && (
            <Button variant="neutral" className="border-danger text-danger hover:border-danger" onClick={onCancelar}>
              <XCircle size={17} /> Cancelar reserva
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function Asistentes({ r }: { r: ReservaDetalle }) {
  return (
    <Bloque icon={<ReceiptText size={17} />} title="Información principal">
      <div className="grid grid-cols-1 gap-3.5 border-b border-cream-tert pb-5 sm:grid-cols-3">
        <MetaItem icon={<CalendarDays size={15} />} label="Fecha" value={r.inicio ? fmtDiaLocal(r.inicio) : "—"} />
        <MetaItem icon={<Clock size={15} />} label="Horario" value={fmtFranja(r.inicio, r.fin) ?? "—"} />
        <MetaItem icon={<Users size={15} />} label="Personas" value={`${r.personas} ${r.personas === 1 ? "persona" : "personas"}`} />
      </div>

      <div className="t-label mt-5 mb-3">ASISTENTES Y DESGLOSE</div>
      {r.asistentes.length === 0 ? (
        <p className="text-sm text-fg-3">La reserva no trae el detalle de asistentes.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[420px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-cream-tert text-left text-[11px] tracking-[.06em] text-fg-3 uppercase">
                <th scope="col" className="w-10 py-2 pr-3 font-semibold">#</th>
                <th scope="col" className="py-2 pr-3 font-semibold">Nombre</th>
                <th scope="col" className="py-2 pr-3 font-semibold">Rango etario</th>
                <th scope="col" className="py-2 text-right font-semibold">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {r.asistentes.map((a) => (
                <tr key={a.renglon} className="border-b border-cream-tert">
                  <td className="py-2.5 pr-3 font-mono text-[13px] text-fg-3">{a.renglon}</td>
                  <td className="py-2.5 pr-3 font-medium text-fg-1">{a.nombre || "—"}</td>
                  <td className="py-2.5 pr-3 text-fg-2">{a.rangoEtario || "—"}</td>
                  <td className="py-2.5 text-right font-mono font-semibold text-fg-1">{moneyAr(a.subtotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-3 flex items-center justify-between rounded-[var(--radius)] bg-green-050 px-[18px] py-3.5">
        <div>
          <div className="text-sm font-semibold text-fg-1">Total</div>
          <div className="mt-0.5 text-xs text-fg-3">{r.personas} {r.personas === 1 ? "persona" : "personas"}</div>
        </div>
        <div className="font-mono text-[22px] font-bold text-green-800">{moneyAr(r.total)}</div>
      </div>
    </Bloque>
  );
}

function DetalleSkeleton() {
  return (
    <>
      <div className="mb-6 overflow-hidden rounded-lg border border-outline-variant bg-surface">
        <Skeleton className="h-[150px] rounded-none" />
        <div className="px-6 pt-5 pb-[22px]">
          <Skeleton className="h-6 w-24 rounded-pill" />
          <Skeleton className="mt-3 h-7 w-[55%]" />
          <Skeleton className="mt-3 h-4 w-[40%]" />
        </div>
      </div>
      <div className="rounded-lg border border-outline-variant bg-surface p-[22px]">
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
          {Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-8" />)}
        </div>
        <div className="mt-6 flex flex-col gap-3">
          {Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-5" />)}
        </div>
        <Skeleton className="mt-4 h-14" />
      </div>
    </>
  );
}

function NoEncontrada() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-sand bg-surface px-6 py-16 text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-cream-tert text-brown-700">
        <SearchX size={28} />
      </div>
      <div className="font-display text-xl font-semibold text-fg-1">Reserva no encontrada</div>
      <div className="max-w-[440px] text-[14.5px] leading-normal text-fg-2">
        No encontramos esta reserva entre las tuyas. Puede que el enlace esté incompleto.
      </div>
      <Link href="/mis-reservas" className="btn btn-primary mt-2">
        <ArrowLeft size={17} /> Volver a Mis reservas
      </Link>
    </div>
  );
}

export default function DetalleClient({ id }: { id: string }) {
  const router = useRouter();
  const { reserva, cancelable, isLoading, error, notFound, unauthenticated, reload } = useReserva(id);
  /** Copia de la reserva al abrir el modal: el reload posterior no debe desmontarlo ni cambiarle los datos. */
  const [aCancelar, setACancelar] = useState<ReservaDetalle | null>(null);

  // Ruta protegida: sin sesión, a la pantalla de login.
  useEffect(() => {
    if (unauthenticated) router.replace("/acceso");
  }, [unauthenticated, router]);

  if (unauthenticated) {
    return (
      <div className="px-7 py-[120px] text-center text-fg-3">
        <Loader size={26} className="spin mx-auto" />
        <div className="mt-3 text-sm">Redirigiendo…</div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1160px] px-7 pt-8 pb-20">
      <div className="mb-3.5 flex items-center gap-2.5 text-[13px] text-fg-3">
        <Link href="/" className="text-fg-3 no-underline">Inicio</Link>
        <ChevronRight size={14} />
        <Link href="/mis-reservas" className="text-fg-2 no-underline">Mis reservas</Link>
        <ChevronRight size={14} />
        <span className="font-medium text-fg-2">Detalle de la reserva</span>
      </div>

      <Link href="/mis-reservas" className="btn btn-neutral btn-sm mb-4 inline-flex items-center gap-[7px]">
        <ArrowLeft size={16} /> Volver a Mis reservas
      </Link>

      <h1 className="mb-6 font-display text-[34px] font-bold tracking-[-.01em] text-fg-1">Detalle de la reserva</h1>

      <AsyncBoundary loading={isLoading} error={error} onRetry={reload} skeleton={<DetalleSkeleton />} pad={72}>
        {notFound || !reserva ? (
          <NoEncontrada />
        ) : (
          <>
            <Cabecera r={reserva} onCancelar={cancelable ? () => setACancelar(reserva) : undefined} />
            <Asistentes r={reserva} />
          </>
        )}
      </AsyncBoundary>

      {/* Fuera del AsyncBoundary: al recargar la reserva tras cancelar, el
          esqueleto no tiene que llevarse puesto el modal con el resultado. La
          lista no tiene caché: /mis-reservas vuelve a pedir al montarse. */}
      {aCancelar && (
        <CancelarReservaModal reserva={aCancelar} onClose={() => setACancelar(null)} onCambio={reload} />
      )}
    </div>
  );
}
