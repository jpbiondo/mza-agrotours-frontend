"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Loader, PlusCircle, Building2, Hash, MapPin, CalendarDays, FileSearch,
} from "lucide-react";
import AsyncBoundary from "@/components/AsyncBoundary";
import { Card, EstadoBadge } from "@/components/ui";
import { SOL_ESTADO_META } from "@/data/solicitudes";
import { fmtFechaHora } from "@/lib/format";
import { useMisSolicitudes } from "@/hooks/useMisSolicitudes";
import type { SolicitudResumen } from "@/types/solicitudes";

const NUEVA_HREF = "/mis-solicitudes/nueva";

function SolicitudCard({ s }: { s: SolicitudResumen }) {
  // El estado viene del backend: si llegara un valor fuera del enum, se muestra
  // en tono neutro en vez de romper o de etiquetarlo mal.
  const meta = SOL_ESTADO_META[s.estado] as
    | (typeof SOL_ESTADO_META)[keyof typeof SOL_ESTADO_META]
    | undefined;

  return (
    // TODO: cuando exista GET /solicitudes-establecimiento/{id}, envolver en un
    // <Link href={`/mis-solicitudes/${s.id}`}> y agregar la afordancia de click.
    // Por ahora la tarjeta es informativa: enlazar a una ruta inexistente daría 404.
    <Card className="px-[22px] py-[18px]">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-md bg-green-050">
            <Building2 className="size-[18px] text-green-800" />
          </span>
          <div className="min-w-0">
            <h2 className="truncate font-display text-[18.5px] leading-tight font-semibold text-fg-1">
              {s.nombreEstablecimiento || s.razonSocial || "Establecimiento sin nombre"}
            </h2>
            {s.razonSocial && (
              <p className="mt-0.5 truncate text-[13.5px] text-fg-2">{s.razonSocial}</p>
            )}
            <dl className="mt-2.5 flex flex-col gap-1.5 sm:flex-row sm:flex-wrap sm:gap-x-6">
              <div className="flex min-w-0 items-center gap-1.5">
                <Hash className="size-[13px] shrink-0 text-fg-3" />
                <dt className="sr-only">CUIT</dt>
                <dd className="font-mono text-[12.5px] text-fg-2">{s.cuit || "—"}</dd>
              </div>
              <div className="flex min-w-0 items-center gap-1.5">
                <MapPin className="size-[13px] shrink-0 text-fg-3" />
                <dt className="sr-only">Domicilio legal</dt>
                <dd className="truncate text-[13px] text-fg-2">{s.domicilioLegal || "—"}</dd>
              </div>
              <div className="flex min-w-0 items-center gap-1.5">
                <CalendarDays className="size-[13px] shrink-0 text-fg-3" />
                <dt className="sr-only">Enviada</dt>
                <dd className="text-[13px] text-fg-3">{fmtFechaHora(s.fechaCreacion)}</dd>
              </div>
            </dl>
          </div>
        </div>
        <EstadoBadge tone={meta?.tone ?? "neutral"}>{meta?.label ?? "Sin estado"}</EstadoBadge>
      </div>
    </Card>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-sand bg-surface px-6 py-16 text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-cream-tert">
        <FileSearch className="size-7 text-brown-700" />
      </div>
      <h2 className="font-display text-xl font-semibold text-fg-1">
        Todavía no enviaste solicitudes
      </h2>
      <p className="max-w-[440px] text-[14.5px] leading-relaxed text-fg-2">
        Cuando pidas el alta de una finca o bodega vas a poder seguir acá el estado de la
        verificación.
      </p>
      <Link href={NUEVA_HREF} className="btn btn-primary btn-lg mt-2 inline-flex">
        <PlusCircle className="size-[18px]" /> Solicitar alta de un establecimiento
      </Link>
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
    <div className="mx-auto max-w-[900px] px-7 pt-10 pb-20">
      {/* Cabecera: queda montada durante la carga y ante un error, así el usuario
          siempre puede iniciar una solicitud nueva. */}
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-[32px] font-bold tracking-[-.01em] text-fg-1">
            Mis solicitudes
          </h1>
          <p className="mt-2 max-w-[620px] text-[15.5px] leading-relaxed text-fg-2">
            Acá vas a ver las solicitudes de alta de establecimiento que enviaste y en qué
            estado está la verificación de cada una. Te avisamos por correo cuando un
            administrador la resuelva.
          </p>
        </div>
        <Link href={NUEVA_HREF} className="btn btn-primary inline-flex shrink-0">
          <PlusCircle className="size-[18px]" /> Nueva solicitud
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
          <>
            <div className="mb-3.5 text-[13.5px] text-fg-3">
              Mostrando <strong className="text-fg-2">{solicitudes.length}</strong>{" "}
              {solicitudes.length === 1 ? "solicitud" : "solicitudes"}
            </div>
            <div className="flex flex-col gap-4">
              {/* Ordenadas por fechaCreacion desc en el hook: las más nuevas arriba. */}
              {solicitudes.map((s) => (
                <SolicitudCard key={s.id} s={s} />
              ))}
            </div>
          </>
        )}
      </AsyncBoundary>
    </div>
  );
}
