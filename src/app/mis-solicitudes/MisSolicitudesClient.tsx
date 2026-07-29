"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Loader, PlusCircle, Building2, MapPin, CalendarDays, ChevronRight, Inbox,
} from "lucide-react";
import AsyncBoundary from "@/components/AsyncBoundary";
import { EstadoBadge } from "@/components/ui";
import { SOL_ESTADO_META } from "@/data/solicitudes";
import { fmtFechaHora } from "@/lib/format";
import { useMisSolicitudes } from "@/hooks/useMisSolicitudes";
import type { SolicitudResumen } from "@/types/solicitudes";

const NUEVA_HREF = "/mis-solicitudes/nueva";

function SolicitudRow({ s }: { s: SolicitudResumen }) {
  // El estado viene del backend: si llegara un valor fuera del enum, se muestra
  // en tono neutro en vez de romper o de etiquetarlo mal.
  const meta = SOL_ESTADO_META[s.estado] as
    | (typeof SOL_ESTADO_META)[keyof typeof SOL_ESTADO_META]
    | undefined;

  return (
    <Link
      href={`/mis-solicitudes/${s.id}`}
      className="flex items-center gap-[18px] rounded-md border border-outline-variant bg-surface px-5 py-[18px] no-underline transition-[box-shadow,border-color] hover:border-sand hover:shadow-[var(--shadow-hover)]"
    >
      <span className="flex size-11 shrink-0 items-center justify-center rounded-[10px] bg-green-050">
        <Building2 className="size-5 text-green-800" />
      </span>

      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2.5">
          <span className="font-display text-[17px] font-bold text-fg-1">
            {s.nombreEstablecimiento || s.razonSocial || "Establecimiento sin nombre"}
          </span>
          <span className="truncate font-mono text-[12px] text-fg-3">{s.id}</span>
        </span>
        <span className="mt-1.5 flex flex-wrap items-center gap-3.5 text-[13px] text-fg-3">
          <span className="inline-flex min-w-0 items-center gap-1.5">
            <MapPin className="size-[14px] shrink-0" />
            <span className="truncate">{s.domicilioLegal || "Sin domicilio"}</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays className="size-[14px] shrink-0" />
            Enviada el {fmtFechaHora(s.fechaHoraAlta)}
          </span>
        </span>
      </span>

      <EstadoBadge tone={meta?.tone ?? "neutral"}>{meta?.label ?? "Sin estado"}</EstadoBadge>
      <ChevronRight className="size-[18px] shrink-0 text-fg-3" />
    </Link>
  );
}

function EmptyState() {
  return (
    <div className="rounded-lg border border-outline-variant bg-surface px-8 py-14 text-center">
      <Inbox className="mx-auto size-[30px] text-fg-3" />
      <p className="mt-3.5 text-[15px] text-fg-2">
        Todavía no enviaste solicitudes. Empezá dando de alta tu establecimiento.
      </p>
    </div>
  );
}

export default function MisSolicitudesClient() {
  const router = useRouter();
  const { solicitudes, isLoading, error, unauthenticated, reload } = useMisSolicitudes();

  // Ruta protegida: sin sesión, a la pantalla de login.
  useEffect(() => {
    if (unauthenticated) router.replace("/acceso");
  }, [unauthenticated, router]);

  if (unauthenticated) {
    return (
      <div className="px-7 py-[120px] text-center text-fg-3">
        <Loader size={26} className="spin" />
        <div className="mt-3 text-sm">Redirigiendo…</div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[900px] px-7 pt-7 pb-24">
      {/* Cabecera: queda montada durante la carga y ante un error, así el usuario
          siempre puede iniciar una solicitud nueva. */}
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-[240px]">
          <h1 className="font-display text-[32px] font-bold tracking-[-.01em] text-fg-1">
            Mis solicitudes
          </h1>
          <p className="mt-1.5 text-[15px] text-fg-2">
            Seguí el estado de las solicitudes de alta de establecimiento que enviaste.
          </p>
        </div>
        <Link href={NUEVA_HREF} className="btn btn-primary inline-flex shrink-0 no-underline">
          <PlusCircle className="size-[17px]" /> Nueva solicitud
        </Link>
      </div>

      <AsyncBoundary
        loading={isLoading}
        error={error}
        onRetry={reload}
        loadingLabel="Cargando tus solicitudes…"
        pad={72}
      >
        {solicitudes.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="flex flex-col gap-3">
            {/* Ordenadas por fechaHoraAlta desc en el hook: las más nuevas arriba. */}
            {solicitudes.map((s) => (
              <SolicitudRow key={s.id} s={s} />
            ))}
          </div>
        )}
      </AsyncBoundary>
    </div>
  );
}
