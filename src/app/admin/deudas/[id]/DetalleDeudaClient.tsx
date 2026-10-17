"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, Calendar, ChevronRight, Hash, History, Landmark, Receipt, SearchX } from "lucide-react";
import AsyncBoundary from "@/components/AsyncBoundary";
import { DEUDA_ESTADO_ICON, DeudaBadge } from "@/components/admin/DeudaBadge";
import { Skeleton, buttonClasses } from "@/components/ui";
import { estabInitials } from "@/data/admin";
import { DEUDA_ESTADO_META, pendienteDe } from "@/data/deudas";
import { fmtDiaLocal, fmtHoraLocal, moneyAr } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useDeuda } from "@/hooks/useDeudas";
import type { DeudaDetalle, EstadoHistorialDeuda } from "@/types/deudas";

function FechaHora({ d }: { d: Date | null }) {
  if (!d) return <>—</>;
  return <>{fmtDiaLocal(d)} · {fmtHoraLocal(d)}</>;
}

/** Borde del punto de la línea de tiempo, por tono del estado. */
const PUNTO = {
  danger: "border-danger text-danger",
  warning: "border-warning text-warning",
  success: "border-success text-success",
  info: "border-info text-info",
};

function PasoHistorial({ h, ultimo }: { h: EstadoHistorialDeuda; ultimo: boolean }) {
  const Icono = DEUDA_ESTADO_ICON[h.estado];
  // El backend deja sin fin sólo al estado vigente, que es el último.
  const actual = ultimo && h.hasta === null;
  return (
    <div className="flex gap-4">
      <div className="flex shrink-0 flex-col items-center">
        <span className={cn("z-[1] flex size-[30px] items-center justify-center rounded-full border-2 bg-surface", PUNTO[DEUDA_ESTADO_META[h.estado].tone])}>
          <Icono size={15} />
        </span>
        {!ultimo && <span className="my-0.5 min-h-6 w-0.5 flex-1 bg-outline-variant" />}
      </div>
      <div className={cn("min-w-0 flex-1", !ultimo && "pb-[22px]")}>
        <div className="flex flex-wrap items-center gap-2.5">
          <DeudaBadge estado={h.estado} />
          {actual && (
            <span className="rounded-pill border border-green-100 bg-green-050 px-[9px] py-0.5 text-[11.5px] font-bold text-green-800">Estado actual</span>
          )}
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2 font-mono text-[12.5px] text-fg-2">
          <Calendar size={13} className="text-fg-3" /> <FechaHora d={h.desde} />
          <ArrowRight size={12} className="text-fg-3" />
          {h.hasta ? <FechaHora d={h.hasta} /> : <span className="font-semibold text-green-800">En curso</span>}
        </div>
        {/* El motivo es opcional en el backend: sin él, el paso queda sólo con fechas y monto. */}
        {h.motivo && <p className="mt-[9px] text-sm leading-normal break-words text-fg-1">{h.motivo}</p>}
        {h.montoTransaccion > 0 && (
          <div className="mt-3 inline-flex items-center gap-2.5 rounded-[var(--radius)] border border-outline-variant bg-cream-tert px-3.5 py-2.5">
            <Receipt size={14} className="text-fg-3" />
            <span className="text-[13px] text-fg-2">Devuelto en este paso</span>
            <span className="font-mono text-[13.5px] font-bold text-success-fg">{moneyAr(h.montoTransaccion)}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function Cabecera({ d }: { d: DeudaDetalle }) {
  return (
    <div className="mb-[22px] flex min-w-0 items-center gap-4">
      <span className="inline-flex size-[54px] shrink-0 items-center justify-center rounded-xl bg-green-050 font-display text-[17px] font-bold text-green-800">
        {estabInitials(d.deudor || "?")}
      </span>
      <div className="min-w-0">
        <h2 className="font-display text-[26px] leading-[1.2] font-bold tracking-[-.01em] text-fg-1">{d.deudor || "—"}</h2>
        <div className="mt-[9px] flex flex-wrap items-center gap-3 text-[13.5px] text-fg-2">
          <span className="inline-flex min-w-0 items-center gap-1.5">
            <Hash size={14} className="shrink-0 text-fg-3" />
            <span className="font-mono text-[12.5px] font-semibold break-all">{d.id}</span>
          </span>
          <DeudaBadge estado={d.estado} />
        </div>
        <div className="mt-1.5 text-[13px] text-fg-3">
          Generada el <span className="font-mono"><FechaHora d={d.fecha} /></span>
        </div>
      </div>
    </div>
  );
}

function Montos({ d }: { d: DeudaDetalle }) {
  const pendiente = pendienteDe(d);
  // Con un acuerdo, lo que faltaba para el total se condonó: no es saldo pendiente.
  const condonado = d.estado === "acuerdo" ? Math.max(0, d.montoTotal - d.montoDevuelto) : 0;
  const montos: { label: string; value: number; color: string; nota?: string }[] = [
    { label: "Monto total de la deuda", value: d.montoTotal, color: "text-fg-1" },
    { label: "Monto devuelto", value: d.montoDevuelto, color: "text-success-fg" },
    {
      label: "Saldo pendiente",
      value: pendiente,
      color: pendiente > 0 ? "text-danger-fg" : "text-success-fg",
      nota: d.estado === "acuerdo" ? `Saldada por acuerdo${condonado > 0 ? `: se condonaron ${moneyAr(condonado)}` : ""}.` : undefined,
    },
  ];
  return (
    <div className="mb-7 grid grid-cols-[repeat(auto-fit,minmax(190px,1fr))] gap-4">
      {montos.map((m) => (
        <div key={m.label} className="rounded-[var(--radius)] border border-outline-variant bg-surface px-5 py-4">
          <div className="t-label mb-1.5">{m.label}</div>
          <div className={cn("font-mono text-[22px] font-bold", m.color)}>{moneyAr(m.value)}</div>
          {m.nota && <div className="mt-1 text-[12.5px] text-fg-3">{m.nota}</div>}
        </div>
      ))}
    </div>
  );
}

function Historial({ d }: { d: DeudaDetalle }) {
  return (
    <section className="overflow-hidden rounded-lg border border-outline-variant bg-surface">
      <div className="flex items-center gap-[11px] border-b border-cream-tert px-6 py-[18px]">
        <div className="flex size-[30px] items-center justify-center rounded-lg bg-green-050 text-green-800"><History size={16} /></div>
        <div>
          <h2 className="font-display text-[18px] font-semibold text-fg-1">Historial de la deuda</h2>
          <div className="mt-0.5 text-[12.5px] text-fg-3">Estados por los que pasó la deuda, en orden cronológico.</div>
        </div>
      </div>
      <div className="p-6">
        {/* En el orden del backend, del más viejo al más nuevo. */}
        {d.historial.map((h, i) => <PasoHistorial key={i} h={h} ultimo={i === d.historial.length - 1} />)}
      </div>
    </section>
  );
}

function NoEncontrada() {
  return (
    <div className="rounded-lg border border-outline-variant bg-surface px-8 py-[60px] text-center">
      <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-cream-tert text-brown-700">
        <SearchX size={24} />
      </div>
      <h3 className="font-display text-[19px] font-semibold text-fg-1">La deuda no pudo ser encontrada</h3>
      <p className="mx-auto mt-2 max-w-[420px] text-sm leading-[1.55] text-fg-2">Revisá el enlace o volvé al listado de deudas.</p>
      <Link href="/admin/deudas" className={buttonClasses({ variant: "neutral", className: "mt-5" })}>
        <ArrowLeft size={16} /> Volver a deudas
      </Link>
    </div>
  );
}

function DetalleSkeleton() {
  return (
    <>
      <div className="mb-[22px] flex items-center gap-4">
        <Skeleton className="size-[54px] rounded-xl" />
        <div className="flex-1">
          <Skeleton className="h-7 w-64" />
          <Skeleton className="mt-3 h-4 w-80" />
        </div>
      </div>
      <div className="mb-7 grid grid-cols-[repeat(auto-fit,minmax(190px,1fr))] gap-4">
        {Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-[84px] rounded-[var(--radius)]" />)}
      </div>
      <Skeleton className="h-[260px] rounded-lg" />
    </>
  );
}

export default function DetalleDeudaClient({ id }: { id: string }) {
  const { deuda, isLoading, error, notFound, reload } = useDeuda(id);

  return (
    <div className="mx-auto max-w-[980px] px-7 pt-7 pb-24">
      <div className="mb-3.5 flex flex-wrap items-center gap-2.5 text-[13.5px] text-fg-3">
        <span>Deudas y reembolsos</span>
        <ChevronRight size={15} />
        <Link href="/admin/deudas" className="text-fg-3 no-underline hover:underline">Deudas de productores</Link>
        <ChevronRight size={15} />
        <span className="font-medium text-fg-2">Detalle</span>
      </div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="flex items-center gap-3 font-display text-[32px] font-bold tracking-[-.01em] text-fg-1">
          <Landmark size={28} className="text-brown-700" /> Detalle de la deuda
        </h1>
        <Link href="/admin/deudas" className={buttonClasses({ variant: "neutral", size: "sm" })}>
          <ArrowLeft size={15} /> Volver
        </Link>
      </div>

      <AsyncBoundary loading={isLoading} error={error} onRetry={reload} skeleton={<DetalleSkeleton />} pad={72}>
        {notFound || !deuda ? (
          <NoEncontrada />
        ) : (
          <>
            <Cabecera d={deuda} />
            <Montos d={deuda} />
            <Historial d={deuda} />
          </>
        )}
      </AsyncBoundary>
    </div>
  );
}
