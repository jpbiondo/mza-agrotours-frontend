"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft, Banknote, CalendarClock, CalendarDays, ChevronRight, ClipboardClock, Clock, CreditCard, Fingerprint,
  HandCoins, Hash, Mail, Phone, ReceiptText, SearchX, User, UserCheck, Users, Warehouse,
} from "lucide-react";
import AsyncBoundary from "@/components/AsyncBoundary";
import { Alert, Button, EstadoBadge, Skeleton, Toast, buttonClasses } from "@/components/ui";
import { ESTADO_META } from "@/data/impagas";
import { fmtDiaLocal, fmtFecha, fmtFranja, fmtHoraLocal, moneyAr } from "@/lib/format";
import { PermisoAdmin } from "@/lib/permisos";
import { tienePermiso } from "@/lib/roles";
import { useReembolso } from "@/hooks/useImpagas";
import { useAuthStore } from "@/stores/authStore";
import type { ContactoReembolso, ReembolsoDetalle } from "@/types/impagas";
import { RegistrarPagoModal } from "./RegistrarPagoModal";

function FechaHora({ d }: { d: Date | null }) {
  if (!d) return <>—</>;
  return <>{fmtDiaLocal(d)} · {fmtHoraLocal(d)}</>;
}

function Dato({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex min-w-0 items-start gap-[9px]">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-cream-tert text-green-800">{icon}</div>
      <div className="min-w-0 leading-[1.2]">
        <div className="text-[10.5px] font-semibold tracking-[.08em] text-fg-3 uppercase">{label}</div>
        <div className="mt-[3px] text-[13.5px] font-medium break-words text-fg-1">{children}</div>
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

function Cabecera({ r, onAgregarPago }: {
  r: ReembolsoDetalle;
  /** Sin GESTIONAR_REEMBOLSOS no se pasa, y el botón no aparece. */
  onAgregarPago?: () => void;
}) {
  const meta = ESTADO_META[r.estado];
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-6 rounded-lg border border-outline-variant bg-surface px-6 py-[22px]">
      <div className="min-w-[240px] flex-1">
        <div className="mb-2 font-mono text-[12px] tracking-[.04em] break-all text-fg-3">{r.id}</div>
        <div className="flex flex-wrap items-center gap-2.5">
          <EstadoBadge tone={meta.tone}>{meta.label}</EstadoBadge>
          <span className="text-[13px] text-fg-2">{meta.desde} <span className="font-mono"><FechaHora d={r.fechaEstado} /></span></span>
        </div>
        <div className="mt-3 flex items-center gap-[7px] text-[15px] font-semibold text-fg-1">
          <Warehouse size={16} className="text-brown-700" /> {r.establecimiento || "—"}
        </div>
        <div className="mt-1.5 text-[13px] text-fg-3">
          Pedido el <span className="font-mono"><FechaHora d={r.fechaPedido} /></span>
        </div>
      </div>
      <div className="flex flex-col items-end gap-4">
        <div className="text-right">
          <div className="t-label mb-1">Monto a reembolsar</div>
          <div className="font-display text-[30px] leading-none font-bold text-fg-1">{moneyAr(r.monto)}</div>
        </div>
        {/* Sólo el impago: el del sistema ya se pagó. */}
        {r.estado === "impago" && onAgregarPago && (
          <Button onClick={onAgregarPago}><Banknote size={17} /> Agregar transferencia de reembolso</Button>
        )}
      </div>
    </div>
  );
}

/** Sólo para los cubiertos por el sistema: el pago con el que el administrador lo resolvió. */
function Pago({ r }: { r: ReembolsoDetalle }) {
  const p = r.pago;
  return (
    <div className="mb-6">
      <Bloque icon={<Banknote size={17} />} title="Pago realizado por el sistema">
        {!p ? (
          <p className="text-sm text-fg-3">Pago no registrado.</p>
        ) : (
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
            <Dato icon={<CalendarClock size={15} />} label="Fecha y hora del pago">
              <span className="font-mono"><FechaHora d={p.fecha} /></span>
            </Dato>
            <Dato icon={<CreditCard size={15} />} label="Método de pago">{p.metodo || "—"}</Dato>
            <Dato icon={<Hash size={15} />} label="ID de la operación">
              <span className="font-mono text-[12.5px] break-all">{p.idExterno || "—"}</span>
            </Dato>
            <Dato icon={<UserCheck size={15} />} label="Registrado por">{p.administrador || "—"}</Dato>
            <Dato icon={<ClipboardClock size={15} />} label="Registrado el">
              <span className="font-mono"><FechaHora d={p.fechaCarga} /></span>
            </Dato>
            <Dato icon={<Fingerprint size={15} />} label="ID del pago">
              <span className="font-mono text-[12.5px] break-all">{p.id || "—"}</span>
            </Dato>
          </div>
        )}
      </Bloque>
    </div>
  );
}

function Reserva({ r }: { r: ReembolsoDetalle }) {
  return (
    <Bloque icon={<ReceiptText size={17} />} title="Reserva">
      <div className="font-display text-[19px] font-semibold text-fg-1">{r.actividad || "Actividad sin nombre"}</div>
      {r.reservaId && <div className="mt-1 font-mono text-[12px] break-all text-fg-3">{r.reservaId}</div>}
      <div className="mt-4 grid grid-cols-1 gap-3.5 border-b border-cream-tert pb-5 sm:grid-cols-3">
        <Dato icon={<CalendarDays size={15} />} label="Día">{r.inicio ? fmtDiaLocal(r.inicio) : "—"}</Dato>
        <Dato icon={<Clock size={15} />} label="Horario">{fmtFranja(r.inicio, r.fin) ?? "—"}</Dato>
        <Dato icon={<Users size={15} />} label="Personas">{r.personas.length}</Dato>
      </div>
      {r.personas.length === 0 ? (
        <p className="mt-4 text-sm text-fg-3">La reserva no tiene personas cargadas.</p>
      ) : (
        <table className="mt-3 w-full border-collapse text-[13.5px]">
          <thead>
            <tr className="text-left text-[11px] font-semibold tracking-[.06em] text-fg-3 uppercase">
              <th className="w-10 py-2 font-semibold">#</th>
              <th className="py-2 font-semibold">Nombre</th>
              <th className="py-2 text-right font-semibold">Fecha de nacimiento</th>
            </tr>
          </thead>
          <tbody>
            {/* En el orden de la reserva, tal cual viene. */}
            {r.personas.map((p, i) => (
              <tr key={i} className="border-t border-cream-tert">
                <td className="py-2.5 font-mono text-fg-3">{i + 1}</td>
                <td className="py-2.5 text-fg-1">{p.nombre || "—"}</td>
                <td className="py-2.5 text-right font-mono text-fg-2">{fmtFecha(p.fechaNacimiento)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Bloque>
  );
}

/** Para el `tel:` sólo sirven dígitos y el `+` inicial. */
function hrefTel(telefono: string): string {
  return `tel:${telefono.replace(/[^\d+]/g, "")}`;
}

function Contacto({ title, c, vacio }: { title: string; c: ContactoReembolso | null; vacio: string }) {
  return (
    <Bloque icon={<User size={17} />} title={title}>
      {!c ? (
        <p className="text-sm text-fg-3">{vacio}</p>
      ) : (
        <div className="flex flex-col gap-3.5">
          <Dato icon={<User size={15} />} label="Nombre">{c.nombre || "—"}</Dato>
          <Dato icon={<Phone size={15} />} label="Teléfono">
            {c.telefono ? <a href={hrefTel(c.telefono)} className="text-green-800 hover:underline">{c.telefono}</a> : "—"}
          </Dato>
          <Dato icon={<Mail size={15} />} label="Email">
            {c.email ? <a href={`mailto:${c.email}`} className="text-green-800 hover:underline">{c.email}</a> : "—"}
          </Dato>
        </div>
      )}
    </Bloque>
  );
}

function NoEncontrado() {
  return (
    <div className="rounded-lg border border-outline-variant bg-surface px-8 py-[60px] text-center">
      <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-cream-tert text-brown-700">
        <SearchX size={24} />
      </div>
      <h3 className="font-display text-[19px] font-semibold text-fg-1">Este reembolso ya no está pendiente</h3>
      <p className="mx-auto mt-2 max-w-[420px] text-sm leading-[1.55] text-fg-2">
        No existe, o ya se resolvió y dejó de estar impago o cubierto por el sistema.
      </p>
      <Link href="/admin/impagas" className={buttonClasses({ variant: "neutral", className: "mt-5" })}>
        <ArrowLeft size={16} /> Volver a reservas impagas
      </Link>
    </div>
  );
}

const GRILLA = "grid grid-cols-1 items-start gap-6 shell:grid-cols-[minmax(0,1fr)_340px]";

function DetalleSkeleton() {
  return (
    <>
      <Skeleton className="mb-6 h-[140px] rounded-lg" />
      <div className={GRILLA}>
        <Skeleton className="h-[320px] rounded-lg" />
        <div className="flex flex-col gap-6">
          <Skeleton className="h-[200px] rounded-lg" />
          <Skeleton className="h-[200px] rounded-lg" />
        </div>
      </div>
    </>
  );
}

export default function DetalleReembolsoClient({ id }: { id: string }) {
  const { reembolso, isLoading, error, notFound, reload, reemplazar } = useReembolso(id);
  // LEER_REEMBOLSOS ya lo exige el guard de la ruta; acá se distingue quién
  // además puede registrar el pago.
  const accesos = useAuthStore((s) => s.accesos);
  const puedeGestionar = tienePermiso(accesos, PermisoAdmin.GESTIONAR_REEMBOLSOS);
  const [registrando, setRegistrando] = useState(false);
  /** Por qué el detalle se recargó por su cuenta: queda a la vista hasta la próxima acción. */
  const [aviso, setAviso] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4200);
    return () => clearTimeout(t);
  }, [toast]);

  function onRegistrado(r: ReembolsoDetalle | null) {
    setRegistrando(false);
    setAviso(null);
    // El listado de impagas no se cachea —se pide al montar—, así que no hay nada que invalidar.
    if (r) reemplazar(r);
    else reload();
    setToast("Pago del reembolso registrado.");
  }

  function onDesactualizado(mensaje: string) {
    setRegistrando(false);
    setAviso(mensaje);
    reload();
  }

  return (
    <div className="mx-auto max-w-[1280px] px-7 pt-7 pb-20">
      <div className="mb-3.5 flex flex-wrap items-center gap-2.5 text-[13.5px] text-fg-3">
        <span>Deudas y reembolsos</span>
        <ChevronRight size={15} />
        <Link href="/admin/impagas" className="text-fg-3 no-underline hover:underline">Reservas impagas</Link>
        <ChevronRight size={15} />
        <span className="font-medium text-fg-2">Detalle</span>
      </div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="flex items-center gap-3 font-display text-[32px] font-bold tracking-[-.01em] text-fg-1">
          <HandCoins size={28} className="text-brown-700" /> Detalle del reembolso
        </h1>
        <Link href="/admin/impagas" className={buttonClasses({ variant: "neutral", size: "sm" })}>
          <ArrowLeft size={15} /> Volver
        </Link>
      </div>

      {aviso && <Alert tone="warning" className="mb-6">{aviso}</Alert>}

      <AsyncBoundary loading={isLoading} error={error} onRetry={reload} skeleton={<DetalleSkeleton />} pad={72}>
        {notFound || !reembolso ? (
          <NoEncontrado />
        ) : (
          <>
            <Cabecera
              r={reembolso}
              onAgregarPago={puedeGestionar ? () => { setAviso(null); setRegistrando(true); } : undefined}
            />
            {reembolso.estado === "sistema" && <Pago r={reembolso} />}
            <div className={GRILLA}>
              <Reserva r={reembolso} />
              <div className="flex flex-col gap-6">
                <Contacto title="Visitante" c={reembolso.visitante} vacio="" />
                <Contacto title="Productor líder" c={reembolso.productorLider} vacio="El establecimiento no tiene productor líder." />
              </div>
            </div>
          </>
        )}
      </AsyncBoundary>

      {registrando && reembolso?.estado === "impago" && (
        <RegistrarPagoModal
          reembolso={reembolso}
          onRegistrado={onRegistrado}
          onDesactualizado={onDesactualizado}
          onCerrar={() => setRegistrando(false)}
        />
      )}
      {toast && <Toast tone="success" title={toast} />}
    </div>
  );
}
