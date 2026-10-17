"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertCircle, CheckCircle2, ChevronRight, Handshake, HandCoins, Landmark, ListTree, Search, SearchX, X } from "lucide-react";
import AsyncBoundary from "@/components/AsyncBoundary";
import { DeudaBadge } from "@/components/admin/DeudaBadge";
import { Alert, Button, Skeleton, Toast, buttonClasses } from "@/components/ui";
import { estabInitials } from "@/data/admin";
import { DEUDA_ESTADO_META, DEUDA_ESTADOS_ORDEN, deudaResoluble, pendienteDe } from "@/data/deudas";
import { fmtDiaLocal, fmtHoraLocal, moneyAr } from "@/lib/format";
import { PermisoAdmin } from "@/lib/permisos";
import { tienePermiso } from "@/lib/roles";
import { cn } from "@/lib/utils";
import { useDeudas } from "@/hooks/useDeudas";
import { useAuthStore } from "@/stores/authStore";
import type { Deuda, EstadoDeuda } from "@/types/deudas";
import { ResolverDeudaModal } from "./ResolverDeudaModal";

type FilterId = "todos" | EstadoDeuda;

const KPI_TONE = {
  danger: "bg-danger-fill text-danger-fg",
  info: "bg-info-fill text-info-fg",
  success: "bg-success-fill text-success-fg",
};

function Kpi({ label, value, icon, tone }: { label: string; value: string | number; icon: React.ReactNode; tone: keyof typeof KPI_TONE }) {
  return (
    <div className="flex items-center gap-3.5 rounded-[var(--radius)] border border-outline-variant bg-surface px-5 py-4">
      <div className={cn("flex size-11 shrink-0 items-center justify-center rounded-[11px]", KPI_TONE[tone])}>{icon}</div>
      <div className="min-w-0">
        <div className="t-label mb-1">{label}</div>
        <div className="font-display text-[22px] leading-[1.05] font-bold text-fg-1">{value}</div>
      </div>
    </div>
  );
}

/**
 * Lo devuelto con una barra de avance sobre el total. Con un acuerdo la deuda
 * quedó saldada aunque lo devuelto no llegue al total: la barra va llena y en
 * vez del porcentaje dice "Acuerdo", para no sugerir que falta cobrar.
 */
function Progreso({ d }: { d: Deuda }) {
  const acuerdo = d.estado === "acuerdo";
  const pct = acuerdo ? 100 : d.montoTotal > 0 ? Math.min(100, Math.round((d.montoDevuelto / d.montoTotal) * 100)) : 0;
  const lleno = pct >= 100;
  return (
    <div className="min-w-[120px]">
      <div className="mb-[5px] flex items-baseline justify-between gap-2">
        <span className={cn("font-mono text-[13.5px] font-semibold", lleno ? "text-success-fg" : "text-fg-1")}>{moneyAr(d.montoDevuelto)}</span>
        <span className={cn("text-[11.5px]", acuerdo ? "font-semibold text-info-fg" : "font-mono text-fg-3")}>{acuerdo ? "Acuerdo" : `${pct}%`}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-cream-tert">
        {/* El ancho es un dato, no un estilo: no hay utilidad de Tailwind para un porcentaje arbitrario. */}
        <div className={cn("h-full", acuerdo ? "bg-info" : lleno ? "bg-success" : "bg-brown-700")} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

const TH = "border-b border-outline-variant px-4 py-[13px] text-left text-[11px] font-semibold tracking-[.06em] whitespace-nowrap text-fg-2 uppercase";

function Fila({ d, onResolver }: {
  d: Deuda;
  /** Sin GESTIONAR_DEUDAS no se pasa, y el botón no aparece. */
  onResolver?: (d: Deuda) => void;
}) {
  const pendiente = pendienteDe(d);
  return (
    <tr className="border-b border-cream-tert last:border-b-0">
      <td className="p-4">
        <div className="flex items-center gap-[11px]">
          <span className="inline-flex size-[38px] shrink-0 items-center justify-center rounded-[9px] bg-green-050 font-display text-[13px] font-bold text-green-800">
            {estabInitials(d.deudor || "?")}
          </span>
          <span className="font-display text-[15px] font-semibold text-fg-1">{d.deudor || "—"}</span>
        </div>
      </td>
      <td className="p-4 font-mono text-[13px] whitespace-nowrap text-fg-2">
        {d.fecha ? <>{fmtDiaLocal(d.fecha)} · {fmtHoraLocal(d.fecha)}</> : <span className="text-fg-3">—</span>}
      </td>
      <td className="p-4 text-right font-mono text-[14.5px] font-semibold whitespace-nowrap text-fg-1">{moneyAr(d.montoTotal)}</td>
      <td className="p-4"><Progreso d={d} /></td>
      <td className="p-4 text-right whitespace-nowrap">
        <div className={cn("font-mono text-[14.5px] font-semibold", pendiente > 0 ? "text-danger-fg" : "text-success-fg")}>{moneyAr(pendiente)}</div>
        {d.estado === "acuerdo" && <div className="mt-0.5 text-[11.5px] text-fg-3">Saldada por acuerdo</div>}
      </td>
      <td className="p-4"><DeudaBadge estado={d.estado} /></td>
      <td className="p-4">
        <div className="flex flex-wrap justify-end gap-2">
          <Link
            href={`/admin/deudas/${encodeURIComponent(d.id)}`}
            className={buttonClasses({ variant: "neutral", size: "sm", className: "whitespace-nowrap" })}
          >
            <ListTree size={15} /> Detalle
          </Link>
          {/* Las saldadas son finales: el backend las rechaza. */}
          {onResolver && deudaResoluble(d.estado) && (
            <Button size="sm" className="whitespace-nowrap" onClick={() => onResolver(d)}>
              <HandCoins size={15} /> Resolver deuda
            </Button>
          )}
        </div>
      </td>
    </tr>
  );
}

function TablaSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg border border-outline-variant bg-surface">
      <Skeleton className="h-11 rounded-none" />
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className="flex items-center gap-6 border-b border-cream-tert p-4 last:border-b-0">
          <div className="flex flex-1 items-center gap-3">
            <Skeleton className="size-[38px] rounded-[9px]" />
            <Skeleton className="h-4 w-44" />
          </div>
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-6 w-28 rounded-pill" />
          <Skeleton className="h-8 w-24" />
        </div>
      ))}
    </div>
  );
}

function Vacio({ buscando, filtrado }: { buscando: boolean; filtrado: boolean }) {
  const [titulo, texto] = buscando
    ? ["Sin resultados", "Probá con otro término de búsqueda o cambiá el filtro de estado."]
    : filtrado
      ? ["No hay deudas en este estado", "Probá con otro filtro de estado."]
      : ["No hay deudas de productores", "Cuando el sistema cubra un reembolso que un productor no pagó, la deuda va a aparecer acá."];
  return (
    <div className="rounded-lg border border-outline-variant bg-surface px-8 py-[60px] text-center">
      <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-cream-tert text-brown-700">
        {buscando ? <SearchX size={24} /> : <Landmark size={24} />}
      </div>
      <h3 className="font-display text-[19px] font-semibold text-fg-1">{titulo}</h3>
      <p className="mx-auto mt-2 max-w-[400px] text-sm leading-[1.55] text-fg-2">{texto}</p>
    </div>
  );
}

const FILTERS: { id: FilterId; label: string }[] = [
  { id: "todos", label: "Todos" },
  ...DEUDA_ESTADOS_ORDEN.map((e) => ({ id: e, label: DEUDA_ESTADO_META[e].label })),
];

export default function DeudasClient() {
  const { deudas, isLoading, error, reload } = useDeudas();
  // LEER_DEUDAS ya lo exige el guard de la ruta; acá se distingue quién además puede resolverlas.
  const accesos = useAuthStore((s) => s.accesos);
  const puedeGestionar = tienePermiso(accesos, PermisoAdmin.GESTIONAR_DEUDAS);
  const [resolviendo, setResolviendo] = useState<Deuda | null>(null);
  /** Por qué la lista se recargó por su cuenta: queda a la vista hasta la próxima acción. */
  const [aviso, setAviso] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4200);
    return () => clearTimeout(t);
  }, [toast]);

  function abrirResolver(d: Deuda) {
    setAviso(null);
    setResolviendo(d);
  }

  // La fila no trae el detalle: se vuelve a pedir la lista para ver el estado nuevo.
  function onResuelta() {
    setResolviendo(null);
    reload();
    setToast("Cambio de estado registrado.");
  }

  function onDesactualizado(mensaje: string) {
    setResolviendo(null);
    setAviso(mensaje);
    reload();
  }
  const [filter, setFilter] = useState<FilterId>("todos");
  const [query, setQuery] = useState("");

  const counts = useMemo(() => {
    const c: Record<FilterId, number> = { todos: deudas.length, sin_devolver: 0, parcial: 0, total: 0, acuerdo: 0 };
    for (const d of deudas) c[d.estado]++;
    return c;
  }, [deudas]);

  const totalAdeudado = useMemo(
    () => deudas.reduce((s, d) => s + pendienteDe(d), 0),
    [deudas],
  );

  // Sin reordenar: el backend ya las manda de la más vieja a la más nueva.
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return deudas.filter((d) => {
      if (filter !== "todos" && d.estado !== filter) return false;
      if (!q) return true;
      return [d.id, d.deudor].join(" ").toLowerCase().includes(q);
    });
  }, [deudas, filter, query]);

  const kpi = (v: string | number) => (isLoading ? "–" : v);

  return (
    <div className="mx-auto max-w-[1280px] px-7 pt-7 pb-20">
      <div className="mb-3.5 flex items-center gap-2.5 text-[13.5px] text-fg-3">
        <span>Deudas y reembolsos</span>
        <ChevronRight size={15} />
        <span className="font-medium text-fg-2">Deudas de productores</span>
      </div>
      <div className="mb-6">
        <h1 className="font-display text-[32px] font-bold tracking-[-.01em] text-fg-1">Deudas de productores</h1>
        <p className="mt-2.5 max-w-[720px] text-[15.5px] leading-normal text-fg-2">
          Deudas que las fincas tienen con la plataforma por reembolsos que el sistema cubrió, con lo que llevan devuelto.
        </p>
      </div>

      <div className="mb-[26px] grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4">
        <Kpi label="Total adeudado" value={kpi(moneyAr(totalAdeudado))} icon={<Landmark size={20} />} tone="danger" />
        <Kpi label="Sin devolver" value={kpi(counts.sin_devolver)} icon={<AlertCircle size={20} />} tone="danger" />
        <Kpi label="Con acuerdo" value={kpi(counts.acuerdo)} icon={<Handshake size={20} />} tone="info" />
        <Kpi label="Saldadas" value={kpi(counts.total)} icon={<CheckCircle2 size={20} />} tone="success" />
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
        <div className="inline-flex flex-wrap gap-0.5 rounded-[var(--radius)] border border-outline-variant bg-surface p-1">
          {FILTERS.map((o) => {
            const on = filter === o.id;
            return (
              <button
                key={o.id}
                type="button"
                onClick={() => setFilter(o.id)}
                aria-pressed={on}
                className={cn(
                  "flex cursor-pointer items-center gap-2 rounded-[calc(var(--radius)-2px)] border-none px-3.5 py-2 text-[13.5px] whitespace-nowrap",
                  on ? "bg-green-800 font-semibold text-white" : "bg-transparent font-medium text-fg-2",
                )}
              >
                {o.label}
                <span className={cn("inline-flex h-[18px] min-w-[22px] items-center justify-center rounded-[9px] px-[7px] text-[11px] font-bold", on ? "bg-white/20 text-white" : "bg-cream-tert text-fg-2")}>
                  {isLoading ? "–" : counts[o.id]}
                </span>
              </button>
            );
          })}
        </div>
        <div className="relative max-w-[400px] min-w-[220px] flex-[1_1_280px]">
          <Search size={17} className="pointer-events-none absolute top-1/2 left-[13px] -translate-y-1/2 text-fg-3" />
          <input
            placeholder="Buscar por establecimiento o ID"
            aria-label="Buscar deudas"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-[var(--radius)] border border-sand bg-surface py-[11px] pr-9 pl-[38px] font-sans text-[15px] text-fg-1 outline-none"
          />
          {query && (
            <button
              type="button"
              aria-label="Limpiar"
              onClick={() => setQuery("")}
              className="absolute top-1/2 right-2 flex size-[26px] -translate-y-1/2 cursor-pointer items-center justify-center rounded-md border-none bg-transparent text-fg-3"
            >
              <X size={15} />
            </button>
          )}
        </div>
      </div>

      {aviso && <Alert tone="warning" className="mb-4">{aviso}</Alert>}

      <AsyncBoundary loading={isLoading} error={error} onRetry={reload} skeleton={<TablaSkeleton />} pad={72}>
        {visible.length === 0 ? (
          <Vacio buscando={!!query.trim()} filtrado={deudas.length > 0} />
        ) : (
          <div className="overflow-hidden rounded-lg border border-outline-variant bg-surface">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1040px] border-collapse">
                <thead>
                  <tr className="bg-cream-tert">
                    <th className={TH}>Establecimiento deudor</th>
                    <th className={TH}>Fecha de la deuda</th>
                    <th className={cn(TH, "text-right")}>Monto total</th>
                    <th className={TH}>Devuelto</th>
                    <th className={cn(TH, "text-right")}>Pendiente</th>
                    <th className={TH}>Estado</th>
                    <th className={cn(TH, "text-right")}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((d) => <Fila key={d.id} d={d} onResolver={puedeGestionar ? abrirResolver : undefined} />)}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </AsyncBoundary>

      {resolviendo && (
        <ResolverDeudaModal
          deuda={resolviendo}
          onResuelta={onResuelta}
          onDesactualizado={onDesactualizado}
          onCerrar={() => setResolviendo(null)}
        />
      )}
      {toast && <Toast tone="success" title={toast} />}
    </div>
  );
}
