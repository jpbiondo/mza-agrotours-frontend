"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import {
  Banknote, CalendarDays, Check, ChevronRight, Clock, Inbox, Loader, Receipt,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import AsyncBoundary from "@/components/AsyncBoundary";
import { Pagination } from "@/components/catalog/controls";
import { Alert, Button, Card, EstadoBadge, Skeleton, Toast } from "@/components/ui";
import type { ToastData } from "@/components/ui";
import { Sheet, SheetBody, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useEstablecimientos } from "@/hooks/useEstablecimientos";
import {
  REEMBOLSOS_POR_PAGINA, useReembolsar, useReembolsosPendientes,
} from "@/hooks/useReembolsosPendientes";
import { fmtDiaLargo, fmtDiaLocal, fmtHoraLocal, moneyAr } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ReembolsoPendiente } from "@/types/reembolsos";

const RECHAZADO =
  "Mercado Pago rechazó el reembolso. Revisá el saldo de tu cuenta e intentá de nuevo.";
const ERROR_TECNICO =
  "No pudimos pedir el reembolso. Probá de nuevo en unos minutos.";

const fechaCorta = (d: Date | null) => (d ? fmtDiaLocal(d) : "—");
const cuposLabel = (n: number) => `${n} ${n === 1 ? "cupo" : "cupos"}`;

/* ---- KPI ----------------------------------------------------------------- */

function MiniKpi({ label, value, icon: Icon, tone }: {
  label: string;
  value: ReactNode;
  icon: LucideIcon;
  tone: "warning" | "info";
}) {
  return (
    <div className="flex min-w-0 items-center gap-4 rounded-md border border-outline-variant bg-surface px-5.5 py-4.5">
      <span
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-[10px]",
          tone === "warning" ? "bg-warning-fill text-warning-fg" : "bg-info-fill text-info-fg",
        )}
      >
        <Icon className="size-5" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <div className="t-label mb-1 truncate">{label}</div>
        <div className="font-display text-2xl leading-[1.1] font-bold tracking-[-.01em] text-fg-1">
          {value}
        </div>
      </div>
    </div>
  );
}

/* ---- Tabla --------------------------------------------------------------- */

const TH = "border-b border-outline-variant px-4 py-3 text-left text-[11px] font-semibold tracking-[.06em] text-fg-2 uppercase";

function Tabla({ reembolsos, onAbrir }: {
  reembolsos: ReembolsoPendiente[];
  onAbrir: (r: ReembolsoPendiente) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] border-collapse">
        <thead>
          <tr className="bg-cream-tert">
            <th className={cn(TH, "pl-5")}>Actividad</th>
            <th className={TH}>Visitante</th>
            <th className={cn(TH, "text-right")}>Monto</th>
            <th className={TH}>Estado</th>
            <th className={TH}><span className="sr-only">Detalle</span></th>
          </tr>
        </thead>
        <tbody>
          {reembolsos.map((r) => (
            <tr
              key={r.id}
              onClick={() => onAbrir(r)}
              className="cursor-pointer border-b border-cream-tert align-top transition-colors last:border-b-0 hover:bg-cream-tert"
            >
              <td className="py-4.5 pr-4 pl-5">
                <div className="text-sm font-medium text-fg-1">{r.actividad || "—"}</div>
                <div className="mt-0.5 flex items-center gap-1.5 text-[12.5px] text-fg-3">
                  <CalendarDays className="size-3" aria-hidden />
                  {fechaCorta(r.diaActividad)}
                </div>
              </td>
              <td className="px-4 py-4.5">
                <div className="text-sm text-fg-1">{r.visitante || "—"}</div>
                <div className="mt-0.5 text-[12.5px] text-fg-3">{cuposLabel(r.cupos)}</div>
              </td>
              <td className="px-4 py-4.5 text-right">
                <div className="font-mono text-[15px] font-semibold text-fg-1">{moneyAr(r.monto)}</div>
                <div className="mt-0.5 text-[11.5px] text-fg-3">solicitado {fechaCorta(r.fechaPedido)}</div>
              </td>
              <td className="w-[140px] px-4 py-4.5">
                <EstadoBadge tone="warning">Pendiente</EstadoBadge>
              </td>
              <td className="w-14 px-4 py-4.5 text-right">
                {/* La fila entera abre el detalle con el mouse; este botón es la
                    entrada por teclado y para el lector de pantalla. */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAbrir(r);
                  }}
                  aria-label={`Ver el reembolso de ${r.visitante || "la reserva"}`}
                  className="inline-flex size-8 cursor-pointer items-center justify-center rounded-md text-fg-3 hover:bg-surface hover:text-fg-1"
                >
                  <ChevronRight className="size-4" aria-hidden />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TablaEsqueleto() {
  return (
    <div aria-busy="true" aria-label="Cargando reembolsos…" className="flex flex-col gap-2 p-4">
      <Skeleton className="mb-2 h-6 w-72" />
      {Array.from({ length: 5 }, (_, i) => <Skeleton key={i} className="h-[62px]" />)}
    </div>
  );
}

function SinPendientes() {
  return (
    <div className="flex flex-col items-center px-8 py-15 text-center">
      <span className="mb-4 flex size-14 items-center justify-center rounded-full bg-cream-tert">
        <Receipt className="size-6 text-brown-700" aria-hidden />
      </span>
      <h2 className="font-display text-[19px] font-semibold text-fg-1">No hay reembolsos pendientes</h2>
      <p className="mx-auto mt-2 max-w-[380px] text-sm leading-normal text-fg-2">
        Si Mercado Pago no puede devolver un pago cuando se cancela una reserva, lo vas a ver
        acá para reintentarlo.
      </p>
    </div>
  );
}

/* ---- Detalle ------------------------------------------------------------- */

function Dato({ label, children, sub, grande, mono }: {
  label: string;
  children: ReactNode;
  sub?: string;
  grande?: boolean;
  mono?: boolean;
}) {
  return (
    <div className="border-b border-dashed border-cream-tert py-3">
      <div className="t-label mb-1.5">{label}</div>
      <div
        className={cn(
          "font-medium text-fg-1",
          mono ? "font-mono" : "font-sans",
          grande ? "text-[22px] font-bold tracking-[-.01em]" : "text-[14.5px]",
        )}
      >
        {children}
      </div>
      {sub && <div className="mt-[3px] text-[12.5px] text-fg-3">{sub}</div>}
    </div>
  );
}

/**
 * Hoja lateral desde `sm:`, como el cajón del diseño; en angosto ocupa la
 * pantalla, que es el comportamiento base del `Sheet`.
 */
const HOJA_LATERAL = cn(
  "sm:inset-y-0 sm:right-0 sm:left-auto sm:top-0 sm:max-h-none sm:w-[460px] sm:rounded-none",
  "sm:border-t-0 sm:border-l sm:border-outline-variant sm:shadow-pop",
  "sm:data-[starting-style]:translate-x-full sm:data-[starting-style]:translate-y-0",
  "sm:data-[ending-style]:translate-x-full sm:data-[ending-style]:translate-y-0",
);

function Detalle({ reembolso, error, reembolsando, onCerrar, onReembolsar }: {
  reembolso: ReembolsoPendiente | null;
  error: string | null;
  reembolsando: boolean;
  onCerrar: () => void;
  onReembolsar: (r: ReembolsoPendiente) => void;
}) {
  return (
    <Sheet open={!!reembolso} onOpenChange={(abierto) => { if (!abierto && !reembolsando) onCerrar(); }}>
      <SheetContent className={HOJA_LATERAL}>
        {reembolso && (
          <>
            <SheetHeader className="py-3 pl-6">
              <div className="min-w-0">
                <EstadoBadge tone="warning" className="mb-1.5">Pendiente</EstadoBadge>
                <SheetTitle className="text-xl font-semibold text-balance">
                  {reembolso.actividad || "Reembolso"}
                </SheetTitle>
              </div>
            </SheetHeader>

            <SheetBody className="px-6 py-4">
              <Dato label="Visitante" sub={reembolso.emailVisitante || undefined}>
                {reembolso.visitante || "—"}
              </Dato>
              <Dato label="Fecha de la actividad">
                {reembolso.diaActividad
                  ? `${fmtDiaLargo(reembolso.diaActividad)} · ${fmtHoraLocal(reembolso.diaActividad)}`
                  : "—"}
              </Dato>
              <Dato label="Cupos reservados">{cuposLabel(reembolso.cupos)}</Dato>
              <Dato label="Fecha de solicitud">
                {reembolso.fechaPedido ? fmtDiaLargo(reembolso.fechaPedido) : "—"}
              </Dato>
              <Dato label="Monto a devolver" grande mono>{moneyAr(reembolso.monto)}</Dato>

              {error && <Alert className="mt-4">{error}</Alert>}
            </SheetBody>

            <footer className="flex shrink-0 justify-between gap-3 border-t border-cream-tert bg-cream-bg px-6 py-4">
              <Button variant="ghost" onClick={onCerrar} disabled={reembolsando}>Cancelar</Button>
              <Button onClick={() => onReembolsar(reembolso)} disabled={reembolsando}>
                {reembolsando ? <Loader className="spin size-4" /> : <Check className="size-4" />}
                Reembolsar
              </Button>
            </footer>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

/* ---- Pantalla ------------------------------------------------------------ */

function SinEstablecimiento() {
  return (
    <div className="mx-auto max-w-[640px] px-7 pt-16 pb-24 text-center">
      <Inbox className="mx-auto size-8 text-fg-3" />
      <p className="mt-3.5 text-[15px] text-fg-2">Todavía no administrás ningún establecimiento.</p>
    </div>
  );
}

export default function ReembolsosClient() {
  const { activo } = useEstablecimientos();
  const establecimientoId = activo?.id ?? "";
  const [pagina, setPagina] = useState(1);
  const { reembolsos, total, totalPaginas, isLoading, error, reload } =
    useReembolsosPendientes(establecimientoId, pagina);
  const { reembolsar, isLoading: reembolsando } = useReembolsar();
  const [abierto, setAbierto] = useState<ReembolsoPendiente | null>(null);
  const [errorDetalle, setErrorDetalle] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastData | null>(null);

  if (!establecimientoId) return <SinEstablecimiento />;

  // Con todo en una página la suma es el total real; con más, sería la de esta
  // página sola y engañaría, así que no se muestra.
  const montoTotal = totalPaginas <= 1 ? reembolsos.reduce((s, r) => s + r.monto, 0) : null;
  const desde = (pagina - 1) * REEMBOLSOS_POR_PAGINA;

  function notificar(t: ToastData) {
    setToast(t);
    setTimeout(() => setToast((actual) => (actual === t ? null : actual)), 3400);
  }

  function abrir(r: ReembolsoPendiente) {
    setErrorDetalle(null);
    setAbierto(r);
  }

  /**
   * Sale del listado y se vuelve a pedir. Si era el único de una página que no
   * es la primera, se retrocede una: esa página ya no existe.
   */
  function refrescarSinElUltimo() {
    if (reembolsos.length === 1 && pagina > 1) setPagina((p) => p - 1);
    else reload();
  }

  async function onReembolsar(r: ReembolsoPendiente) {
    setErrorDetalle(null);
    const res = await reembolsar(establecimientoId, r.id);

    if (res.ok) {
      if (res.resultado === "RECHAZADO") {
        // Sigue pendiente: el detalle queda abierto con el motivo.
        setErrorDetalle(RECHAZADO);
        reload();
        return;
      }
      setAbierto(null);
      refrescarSinElUltimo();
      notificar(
        res.resultado === "REALIZADO"
          ? { tone: "success", title: "Monto de reserva reembolsado correctamente" }
          : {
              tone: "info",
              title: "Reembolso en proceso",
              sub: "Mercado Pago lo está confirmando",
            },
      );
      return;
    }

    if (res.code === "reembolsoNoPendiente" || res.code === "reembolsoNotFound") {
      // Lo resolvió otra pestaña o ya no es de este establecimiento: lo que hay
      // en pantalla está viejo.
      setAbierto(null);
      refrescarSinElUltimo();
      notificar({
        tone: "info",
        title: res.code === "reembolsoNoPendiente"
          ? "Este reembolso ya no estaba pendiente"
          : "Este reembolso ya no existe",
      });
      return;
    }

    setErrorDetalle(
      res.status === 403
        ? "Tu rol en este establecimiento no incluye gestionar reembolsos."
        : ERROR_TECNICO,
    );
  }

  return (
    <div className="mx-auto max-w-[1240px] px-7 pt-7 pb-20">
      <div className="mb-6">
        <h1 className="font-display text-[32px] font-bold tracking-[-.01em] text-fg-1">
          Reembolsos pendientes
        </h1>
        <p className="mt-1.5 max-w-[720px] text-[15px] text-pretty text-fg-2">
          Devoluciones de reservas canceladas que Mercado Pago no pudo hacer solo, por ejemplo
          por falta de saldo en tu cuenta. Reintentalas desde acá.
        </p>
      </div>

      {!isLoading && !error && total > 0 && (
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <MiniKpi label="Solicitudes pendientes" value={total} icon={Clock} tone="warning" />
          {montoTotal !== null && (
            <MiniKpi label="Monto a devolver" value={moneyAr(montoTotal)} icon={Banknote} tone="info" />
          )}
        </div>
      )}

      <Card className="overflow-hidden">
        <AsyncBoundary loading={isLoading} error={error} onRetry={reload} skeleton={<TablaEsqueleto />} pad={64}>
          {reembolsos.length === 0 ? <SinPendientes /> : <Tabla reembolsos={reembolsos} onAbrir={abrir} />}
        </AsyncBoundary>
      </Card>

      {!isLoading && !error && reembolsos.length > 0 && (
        <div className="mt-4.5 flex flex-wrap items-center justify-between gap-4">
          <span className="text-[13px] text-fg-3">
            Mostrando {desde + 1}–{desde + reembolsos.length} de {total} · los más antiguos primero
          </span>
          <Pagination page={pagina} pages={totalPaginas} onPage={setPagina} />
        </div>
      )}

      <Detalle
        reembolso={abierto}
        error={errorDetalle}
        reembolsando={reembolsando}
        onCerrar={() => setAbierto(null)}
        onReembolsar={onReembolsar}
      />

      {toast && <Toast {...toast} />}
    </div>
  );
}
