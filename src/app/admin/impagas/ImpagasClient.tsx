"use client";
import { useMemo, useState } from "react";
import { ChevronRight, AlertCircle, Landmark, Search, X, Warehouse, HandCoins, SearchX, User, ReceiptText } from "lucide-react";
import AsyncBoundary from "@/components/AsyncBoundary";
import { ActionBtn, EstadoBadge, Skeleton } from "@/components/ui";
import { ESTADO_META } from "@/data/impagas";
import { fmtDiaLocal, fmtHoraLocal, moneyAr } from "@/lib/format";
import { PermisoAdmin } from "@/lib/permisos";
import { tienePermiso } from "@/lib/roles";
import { cn } from "@/lib/utils";
import { useImpagas } from "@/hooks/useImpagas";
import { useAuthStore } from "@/stores/authStore";
import type { EstadoReembolso, Reembolso } from "@/types/impagas";

type FilterId = "todos" | EstadoReembolso;

const FILTERS: { id: FilterId; label: string }[] = [
  { id: "todos", label: "Todos" },
  { id: "impago", label: "Impago" },
  { id: "sistema", label: "Reembolso sistema" },
];

const KPI_TONE = {
  danger: "bg-danger-fill text-danger-fg",
  info: "bg-info-fill text-info-fg",
};

function Kpi({ label, value, sub, icon, tone }: { label: string; value: string | number; sub: string; icon: React.ReactNode; tone: keyof typeof KPI_TONE }) {
  return (
    <div className="flex items-center gap-4 rounded-[var(--radius)] border border-outline-variant bg-surface px-[22px] py-[18px]">
      <div className={cn("flex size-11 shrink-0 items-center justify-center rounded-[11px]", KPI_TONE[tone])}>{icon}</div>
      <div className="min-w-0 flex-1">
        <div className="t-label mb-1">{label}</div>
        <div className="font-display text-[26px] leading-[1.05] font-bold text-fg-1">{value}</div>
        <div className="mt-[3px] text-[12.5px] text-fg-3">{sub}</div>
      </div>
    </div>
  );
}

function FechaHora({ d }: { d: Date | null }) {
  if (!d) return <span className="text-fg-3">—</span>;
  return <>{fmtDiaLocal(d)} · {fmtHoraLocal(d)}</>;
}

const TH = "border-b border-outline-variant px-4 py-[13px] text-left text-[11px] font-semibold tracking-[.06em] whitespace-nowrap text-fg-2 uppercase";

function Fila({ r, puedeVerDeudas }: { r: Reembolso; puedeVerDeudas: boolean }) {
  const meta = ESTADO_META[r.estado];
  return (
    <tr className="border-b border-cream-tert last:border-b-0">
      <td className="p-4 align-top">
        <div className="font-mono text-[12.5px] font-semibold text-fg-1">{r.id}</div>
        <div className="mt-1.5 flex items-center gap-[5px] text-[13.5px] text-fg-1">
          <Warehouse size={13} className="shrink-0 text-fg-3" /> {r.establecimiento || "—"}
        </div>
        <div className="mt-0.5 flex items-center gap-[5px] text-xs text-fg-3">
          <User size={12} className="shrink-0" /> {r.productorLider || "Sin productor líder"}
        </div>
      </td>
      <td className="p-4 align-top font-mono text-[13px] text-fg-2"><FechaHora d={r.fechaPedido} /></td>
      <td className="w-[200px] p-4 align-top">
        <EstadoBadge tone={meta.tone}>{meta.label}</EstadoBadge>
        <div className="mt-1.5 text-[11.5px] text-fg-3">{meta.desde}</div>
        <div className="font-mono text-[12.5px] text-fg-2"><FechaHora d={r.fechaEstado} /></div>
      </td>
      <td className="p-4 text-right align-top font-mono text-[15px] font-semibold whitespace-nowrap text-fg-1">{moneyAr(r.monto)}</td>
      <td className="p-4 align-top">
        <div className="flex flex-wrap justify-end gap-2">
          <ActionBtn
            icon={<ReceiptText size={15} />}
            label="Detalle"
            href={`/admin/impagas/${encodeURIComponent(r.id)}`}
            title="Ver el detalle del reembolso"
          />
          {/* Sin LEER_DEUDAS la deuda no se puede abrir: el botón ni aparece. */}
          {r.estado === "sistema" && puedeVerDeudas && (
            r.deudaId ? (
              <ActionBtn
                icon={<Landmark size={15} />}
                label="Ir a deuda"
                href={`/admin/deudas/${encodeURIComponent(r.deudaId)}`}
                title="Ver la deuda asociada"
              />
            ) : (
              // Cubiertos por el sistema antes de que existieran las deudas: no tienen una a la que ir.
              <ActionBtn
                icon={<Landmark size={15} />}
                label="Ir a deuda"
                disabled
                title="Este reembolso no tiene una deuda asociada."
              />
            )
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
          <div className="flex-1">
            <Skeleton className="h-3 w-56" />
            <Skeleton className="mt-2 h-4 w-40" />
          </div>
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-6 w-24 rounded-pill" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-8 w-28" />
        </div>
      ))}
    </div>
  );
}

function Vacio({ buscando, filtrado }: { buscando: boolean; filtrado: boolean }) {
  const [titulo, texto] = buscando
    ? ["Sin resultados", "Probá con otro término de búsqueda o cambiá el filtro de estado."]
    : filtrado
      ? ["No hay reembolsos en este estado", "Probá con otro filtro de estado."]
      : ["No hay reembolsos impagos", "Cuando un productor no pague un reembolso a tiempo, va a aparecer acá para que lo cubra el sistema."];
  return (
    <div className="rounded-lg border border-outline-variant bg-surface px-8 py-[60px] text-center">
      <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-cream-tert text-brown-700">
        {buscando ? <SearchX size={24} /> : <HandCoins size={24} />}
      </div>
      <h3 className="font-display text-[19px] font-semibold text-fg-1">{titulo}</h3>
      <p className="mx-auto mt-2 max-w-[400px] text-sm leading-[1.55] text-fg-2">{texto}</p>
    </div>
  );
}

export default function ImpagasClient() {
  const { reembolsos, isLoading, error, reload } = useImpagas();
  const accesos = useAuthStore((s) => s.accesos);
  const puedeVerDeudas = tienePermiso(accesos, PermisoAdmin.LEER_DEUDAS);
  const [filter, setFilter] = useState<FilterId>("todos");
  const [query, setQuery] = useState("");

  const counts = useMemo(() => {
    const c: Record<FilterId, number> = { todos: reembolsos.length, impago: 0, sistema: 0 };
    for (const r of reembolsos) c[r.estado]++;
    return c;
  }, [reembolsos]);

  const totalImpago = useMemo(
    () => reembolsos.filter((r) => r.estado === "impago").reduce((s, r) => s + r.monto, 0),
    [reembolsos],
  );

  // Sin reordenar: el backend ya los manda del que más espera al que menos.
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return reembolsos.filter((r) => {
      if (filter !== "todos" && r.estado !== filter) return false;
      if (!q) return true;
      return [r.id, r.establecimiento, r.productorLider].join(" ").toLowerCase().includes(q);
    });
  }, [reembolsos, filter, query]);

  return (
    <div className="mx-auto max-w-[1280px] px-7 pt-7 pb-20">
      <div className="mb-3.5 flex items-center gap-2.5 text-[13.5px] text-fg-3">
        <span>Deudas y reembolsos</span>
        <ChevronRight size={15} />
        <span className="font-medium text-fg-2">Reembolsos impagos</span>
      </div>
      <div className="mb-6">
        <h1 className="font-display text-[32px] font-bold tracking-[-.01em] text-fg-1">Reembolsos impagos</h1>
        <p className="mt-2.5 max-w-[680px] text-[15.5px] leading-normal text-fg-2">
          Reembolsos que los productores no pagaron a los visitantes y que tiene que cubrir el sistema, junto con los que el sistema ya pagó.
        </p>
      </div>

      <div className="mb-[26px] grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-4">
        <Kpi
          label="Total reembolsos impagos"
          value={isLoading ? "–" : moneyAr(totalImpago)}
          sub={isLoading ? "Cargando…" : `${counts.impago} reembolso${counts.impago === 1 ? "" : "s"} sin pagar`}
          icon={<AlertCircle size={21} />}
          tone="danger"
        />
        <Kpi
          label="Cubiertos por el sistema"
          value={isLoading ? "–" : counts.sistema}
          sub="Pagados por un administrador"
          icon={<Landmark size={21} />}
          tone="info"
        />
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
            placeholder="Buscar por finca, productor o ID"
            aria-label="Buscar reembolsos"
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

      <AsyncBoundary loading={isLoading} error={error} onRetry={reload} skeleton={<TablaSkeleton />} pad={72}>
        {visible.length === 0 ? (
          <Vacio buscando={!!query.trim()} filtrado={reembolsos.length > 0} />
        ) : (
          <div className="overflow-hidden rounded-lg border border-outline-variant bg-surface">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[920px] border-collapse">
                <thead>
                  <tr className="bg-cream-tert">
                    <th className={TH}>Reembolso</th>
                    <th className={TH}>Fecha y hora pedido</th>
                    <th className={TH}>Estado</th>
                    <th className={cn(TH, "text-right")}>Monto</th>
                    <th className={cn(TH, "text-right")}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((r) => <Fila key={r.id} r={r} puedeVerDeudas={puedeVerDeudas} />)}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </AsyncBoundary>
    </div>
  );
}
