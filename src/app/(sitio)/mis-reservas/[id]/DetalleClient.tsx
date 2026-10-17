"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronRight, ArrowLeft, MapPin, Download, ReceiptText, CalendarDays, Clock, Users,
  SearchX, Loader, XCircle, Map as MapIcon, ExternalLink, Star, CheckCircle2,
} from "lucide-react";
import Photo, { seedDeId } from "@/components/landing/Photo";
import AsyncBoundary from "@/components/AsyncBoundary";
import ContactarEstablecimiento from "@/components/chat/ContactarEstablecimiento";
import MapaEmbed, { consultaMapa, urlComoLlegar } from "@/components/MapaEmbed";
import { Button, EstadoBadge, Skeleton, Toast, buttonClasses } from "@/components/ui";
import type { ToastData } from "@/components/ui";
import { metaEstadoReserva } from "@/data/reservas";
import { fmtDiaLocal, fmtFranja, moneyAr } from "@/lib/format";
import { useReserva } from "@/hooks/useReservas";
import type { ReservaDetalle } from "@/types/reservas";
import { descargarComprobante } from "./comprobante";
import CancelarReservaModal from "./CancelarReservaModal";
import ValorarModal, { type ResultadoValoracion } from "./ValorarModal";

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
        {/* Sin portada cargada queda el degradado por actividad. */}
        <Photo seed={seedDeId(r.actividadId || r.id)} height={150} radius={0} src={r.foto?.url} alt="" />
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
          {/* El chat es por actividad: sin los dos ids no hay a quién escribirle. */}
          {r.actividadId && r.establecimientoId && (
            <ContactarEstablecimiento
              actividadId={r.actividadId}
              establecimientoId={r.establecimientoId}
              titulo={r.actividad}
              etiqueta="Contactar establecimiento"
            />
          )}
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

/**
 * Dónde queda el establecimiento. `ubicacion` es la dirección que cargó el
 * productor; el detalle no trae departamento, así que se busca con la provincia.
 */
function Ubicacion({ r }: { r: ReservaDetalle }) {
  const consulta = consultaMapa(r.ubicacion);
  return (
    <Bloque icon={<MapIcon size={17} />} title="Mapa y ubicación">
      <MapaEmbed
        consulta={consulta}
        titulo={`Mapa de ${r.establecimiento || "el establecimiento"}`}
        className="mb-4 h-60 overflow-hidden rounded-[var(--radius)] border border-outline-variant"
      />
      <div className="flex items-start gap-2.5">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-cream-tert text-green-800">
          <MapPin size={16} />
        </div>
        <div className="min-w-0 leading-[1.4]">
          <div className="text-[14.5px] font-semibold text-fg-1">{r.establecimiento || "Establecimiento"}</div>
          <div className="mt-0.5 text-[13.5px] text-fg-2">{r.ubicacion}</div>
        </div>
      </div>
      <a
        href={urlComoLlegar(consulta)}
        target="_blank"
        rel="noopener noreferrer"
        className={buttonClasses({ variant: "neutral", size: "sm", className: "mt-4 w-full" })}
      >
        Cómo llegar <ExternalLink size={15} />
      </a>
    </Bloque>
  );
}

/**
 * Se valora una reserva Finalizada, y una sola vez. La tarjeta se ve siempre:
 * antes de terminar la actividad explica cuándo se va a poder.
 */
function Valorar({ r, onValorar }: { r: ReservaDetalle; onValorar: () => void }) {
  const finalizada = r.estado === "Finalizada";
  const texto = r.calificada
    ? "Ya valoraste esta actividad. ¡Gracias por contarnos cómo te fue!"
    : finalizada
      ? "Contanos cómo fue tu experiencia. Tu valoración ayuda a otros visitantes y al establecimiento."
      : "Vas a poder valorar la actividad una vez que esté finalizada.";
  return (
    <section className="flex flex-col gap-3 rounded-lg border border-outline-variant bg-surface p-5">
      <div className="flex items-center gap-2.5">
        <Star size={18} className="text-brown-700" />
        <h2 className="font-display text-base font-semibold text-fg-1">Valorar actividad</h2>
      </div>
      <p className="text-[13.5px] leading-normal text-fg-2">{texto}</p>
      <Button className="w-full" disabled={r.calificada || !finalizada} onClick={onValorar}>
        {r.calificada ? <CheckCircle2 size={17} aria-hidden /> : <Star size={17} aria-hidden />}
        {r.calificada ? "Actividad valorada" : "Valorar actividad"}
      </Button>
    </section>
  );
}

/** Información a la izquierda; mapa y valoración a la derecha. Debajo de 880px, apilados. */
const GRILLA = "grid grid-cols-1 items-start gap-6 min-[881px]:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]";

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
      <div className={GRILLA}>
        <div className="rounded-lg border border-outline-variant bg-surface p-[22px]">
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
            {Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-8" />)}
          </div>
          <div className="mt-6 flex flex-col gap-3">
            {Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-5" />)}
          </div>
          <Skeleton className="mt-4 h-14" />
        </div>
        <div className="rounded-lg border border-outline-variant bg-surface p-[22px]">
          <Skeleton className="h-60" />
          <Skeleton className="mt-4 h-4 w-[60%]" />
          <Skeleton className="mt-2 h-4 w-[80%]" />
        </div>
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
  const [valorando, setValorando] = useState(false);
  const [toast, setToast] = useState<ToastData | null>(null);

  function avisar(t: ToastData) {
    setToast(t);
    setTimeout(() => setToast((cur) => (cur === t ? null : cur)), t.tone === "danger" ? 7000 : 5500);
  }

  function alValorar(r: ResultadoValoracion) {
    if (r.ok) {
      setValorando(false);
      avisar({ tone: "success", title: "Valoración enviada", sub: "Muchas gracias por contarnos cómo te fue." });
      reload();
      return;
    }
    // Si la reserva cambió en el backend, se cierra y se vuelve a pedir para
    // que la tarjeta muestre el estado real; si no, se queda con lo escrito.
    if (r.definitivo) {
      setValorando(false);
      reload();
    }
    avisar({ tone: "danger", title: "No se pudo enviar tu valoración", sub: r.mensaje });
  }

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
            <div className={GRILLA}>
              <Asistentes r={reserva} />
              <div className="flex flex-col gap-6">
                {/* Sin dirección no hay nada que ubicar. */}
                {reserva.ubicacion && <Ubicacion r={reserva} />}
                <Valorar r={reserva} onValorar={() => setValorando(true)} />
              </div>
            </div>
          </>
        )}
      </AsyncBoundary>

      {/* Fuera del AsyncBoundary: al recargar la reserva tras cancelar, el
          esqueleto no tiene que llevarse puesto el modal con el resultado. La
          lista no tiene caché: /mis-reservas vuelve a pedir al montarse. */}
      {aCancelar && (
        <CancelarReservaModal reserva={aCancelar} onClose={() => setACancelar(null)} onCambio={reload} />
      )}
      {valorando && reserva && (
        <ValorarModal reserva={reserva} onClose={() => setValorando(false)} onResultado={alValorar} />
      )}
      {toast && <Toast {...toast} />}
    </div>
  );
}
