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
import PagarConMercadoPago from "@/components/reserva/PagarConMercadoPago";
import { Alert, BackLink, Button, EstadoBadge, Skeleton, buttonClasses } from "@/components/ui";
import { notify } from "@/lib/notify";
import { metaEstadoReserva } from "@/data/reservas";
import { fmtDiaLocal, fmtFranja, fmtHoraLocal, moneyAr } from "@/lib/format";
import type { RetornoPago } from "@/lib/mercadoPago";
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

/**
 * Cada cuánto y hasta cuándo se vuelve a pedir la reserva al volver del
 * checkout. Sin webhook, el backend confirma los pagos una vez por minuto: dos
 * minutos cubren una vuelta del scheduler con margen.
 */
const INTERVALO_CONSULTA_MS = 5000;
const MAX_CONSULTAS = 24;

/**
 * Qué pasó con el pago al volver de Mercado Pago. El `?pago=` sólo dice desde
 * qué resultado se volvió (y cualquiera lo puede escribir a mano): lo que se
 * afirma sale del estado real de la reserva.
 */
function AvisoPago({ retorno, r, pagable, esperando }: {
  retorno: RetornoPago;
  r: ReservaDetalle;
  pagable: boolean;
  /** Todavía se está consultando si el backend registró el pago. */
  esperando: boolean;
}) {
  let aviso: React.ReactNode = null;

  if (r.estado === "Pagada") {
    aviso = (
      <Alert tone="success">
        <strong>¡Pago confirmado!</strong> Tu reserva está lista. Te vamos a mandar un recordatorio cerca de la fecha de la actividad.
      </Alert>
    );
  } else if (r.estado === "Expirada") {
    aviso = (
      <Alert>
        <strong>La reserva venció antes de que se completara el pago</strong>, así que los cupos se liberaron.
        {r.actividadId && (
          <>
            {" "}
            <Link href={`/explorar/${r.actividadId}`} className="font-semibold text-danger-fg underline">Reservar de nuevo</Link>
          </>
        )}
      </Alert>
    );
  } else if (r.estado === "Pendiente" && retorno === "rechazado") {
    aviso = (
      <Alert>
        <strong>No se completó el pago.</strong>{" "}
        {pagable && r.checkout
          ? `Tus cupos siguen reservados hasta las ${fmtHoraLocal(r.checkout.vence)}: podés volver a intentarlo con «Pagar con Mercado Pago».`
          : "Tus cupos quedan reservados unos minutos más; si no se paga, la reserva vence y se liberan."}
      </Alert>
    );
  } else if (r.estado === "Pendiente") {
    const aprobado = retorno === "aprobado";
    aviso = (
      <Alert tone="warning" icon={esperando ? <Loader size={18} className="spin" /> : undefined}>
        {aprobado ? (
          esperando ? (
            <><strong>Estamos confirmando tu pago…</strong> Mercado Pago ya lo aprobó; en unos segundos tu reserva pasa a Pagada.</>
          ) : (
            <><strong>Mercado Pago aprobó tu pago</strong> y todavía lo estamos registrando. Volvé a entrar en unos minutos para ver tu reserva confirmada.</>
          )
        ) : (
          <><strong>Tu pago está en proceso.</strong> Mercado Pago lo está revisando; cuando se acredite, la reserva pasa a Pagada.</>
        )}
      </Alert>
    );
  }

  if (!aviso) return null;
  return <div role="status" className="mb-6">{aviso}</div>;
}

function Cabecera({ r, onCancelar, pagable }: { r: ReservaDetalle; onCancelar?: () => void; pagable: boolean }) {
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
          {pagable && r.checkout && <PagarConMercadoPago preferenceId={r.checkout.preferenceId} />}
          <Button variant="neutral" onClick={() => descargarComprobante(r)}>
            <Download size={17} /> Descargar comprobante
          </Button>
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
            <Button variant="danger-outline" onClick={onCancelar}>
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
      <Link href="/mis-reservas" className={buttonClasses({ className: "mt-2" })}>
        <ArrowLeft size={17} /> Volver a Mis reservas
      </Link>
    </div>
  );
}

export default function DetalleClient({ id, retornoPago }: { id: string; retornoPago: RetornoPago | null }) {
  const router = useRouter();
  const {
    reserva, cancelable, pagable, isLoading, error, notFound, unauthenticated, reload, refrescar,
  } = useReserva(id);
  const [consultas, setConsultas] = useState(0);

  // Al volver de un pago aprobado o en proceso, la reserva puede seguir
  // Pendiente hasta que el backend lo registre: se vuelve a pedir sola.
  const esperandoPago = retornoPago !== null && retornoPago !== "rechazado" && reserva?.estado === "Pendiente";
  const esperando = esperandoPago && consultas < MAX_CONSULTAS;
  useEffect(() => {
    if (!esperando) return;
    const t = setTimeout(() => {
      setConsultas((n) => n + 1);
      refrescar();
    }, INTERVALO_CONSULTA_MS);
    return () => clearTimeout(t);
  }, [esperando, consultas, refrescar]);
  /** Copia de la reserva al abrir el modal: el reload posterior no debe desmontarlo ni cambiarle los datos. */
  const [aCancelar, setACancelar] = useState<ReservaDetalle | null>(null);
  const [valorando, setValorando] = useState(false);
  function alValorar(r: ResultadoValoracion) {
    if (r.ok) {
      setValorando(false);
      notify.success("Valoración enviada");
      reload();
      return;
    }
    // La reserva cambió en el backend: se cierra el modal y se vuelve a pedir
    // para que la tarjeta muestre el estado real. Los errores que se pueden
    // reintentar los muestra el propio modal.
    setValorando(false);
    reload();
    notify.error("No se pudo enviar tu valoración", r.mensaje);
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

      <BackLink href="/mis-reservas" className="mb-4">Volver a Mis reservas</BackLink>

      <h1 className="mb-6 font-display text-[34px] font-bold tracking-[-.01em] text-fg-1">Detalle de la reserva</h1>

      <AsyncBoundary loading={isLoading} error={error} onRetry={reload} skeleton={<DetalleSkeleton />} pad={72}>
        {notFound || !reserva ? (
          <NoEncontrada />
        ) : (
          <>
            {retornoPago && <AvisoPago retorno={retornoPago} r={reserva} pagable={pagable} esperando={esperando} />}
            <Cabecera r={reserva} pagable={pagable} onCancelar={cancelable ? () => setACancelar(reserva) : undefined} />
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
    </div>
  );
}
