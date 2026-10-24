"use client";
import { useEffect, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Users, Banknote, CalendarX, TrendingUp, TrendingDown, CheckCircle2, Info, Download, X,
  FileText, FileSpreadsheet, Table2, BarChart3, Grape, Sprout, Wheat, Apple,
} from "lucide-react";
import AsyncBoundary from "@/components/AsyncBoundary";
import { SinPermiso } from "@/components/GuardRol";
import { Donut, BarChart, OccupancyBar } from "@/components/panel/charts";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import { PERIODOS, labelPeriodo } from "@/data/estadisticas";
import { useEstablecimientos } from "@/hooks/useEstablecimientos";
import { useEstadisticas, useExportarReporte, type ExportOpts } from "@/hooks/useEstadisticas";
import { colorDe } from "@/lib/color";
import { notify } from "@/lib/notify";
import { fmtFecha, fmtPctConSigno, moneyAr } from "@/lib/format";
import { TipoPermiso } from "@/lib/permisos";
import { ROL_PRODUCTOR_LIDER, tieneRol } from "@/lib/roles";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/authStore";
import type { ActividadPerf, Periodo, RangoFechas } from "@/types/estadisticas";
import EmptyEstablecimiento from "../../EmptyEstablecimiento";
import { IconButton } from "@/components/ui";

const SIN_ACCESO =
  "Sólo el Productor Líder puede ver las estadísticas del establecimiento. Pedíselas al Productor Líder de la finca.";

/** El backend no manda ícono: se elige por el cultivo, con un brote si no se reconoce. */
function iconoDe(cultivo: string): LucideIcon {
  const t = cultivo.toLowerCase();
  if (/uva|vid|viñ|malbec|bonarda|syrah|cabernet|torront/.test(t)) return Grape;
  if (/durazn|ciruel|manzan|pera|cerez|damasc|membrill|frut/.test(t)) return Apple;
  if (/trigo|ma[ií]z|cebada|cereal|avena/.test(t)) return Wheat;
  return Sprout;
}

const rango = (r: RangoFechas) => `${fmtFecha(r.desde)} – ${fmtFecha(r.hasta)}`;

function PeriodSelect({ value, onChange }: { value: Periodo; onChange: (v: Periodo) => void }) {
  return (
    <div role="radiogroup" aria-label="Período" className="inline-flex gap-0.5 rounded-md border border-outline-variant bg-surface p-1">
      {PERIODOS.map((p) => {
        const on = p.value === value;
        return (
          <button
            key={p.value}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(p.value)}
            className={cn(
              "cursor-pointer rounded-[calc(var(--radius-md)-2px)] border-none px-3.5 py-2 font-sans text-[13.5px] transition-colors duration-150",
              on ? "bg-green-800 font-semibold text-fg-on-dark shadow-[inset_0_-2px_0_var(--green-900)]" : "bg-transparent font-medium text-fg-2 hover:bg-cream-tert",
            )}
          >
            {p.label}
          </button>
        );
      })}
    </div>
  );
}

const TONO_PIE = { neutral: "text-fg-2", success: "text-success-fg", danger: "text-danger-fg" };

function KpiCard({ title, icon: Icon, footer, footerTone = "neutral", children }: {
  title: string;
  icon: LucideIcon;
  footer: React.ReactNode;
  footerTone?: keyof typeof TONO_PIE;
  children: React.ReactNode;
}) {
  return (
    <Card className="flex min-h-[200px] flex-col p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="t-label m-0">{title}</h2>
        <span className="flex size-8 items-center justify-center rounded-lg bg-green-050"><Icon size={16} className="text-green-800" /></span>
      </div>
      <div className="flex flex-1 items-center justify-center">{children}</div>
      <div className={cn("mt-4 flex items-center gap-1.5 border-t border-cream-tert pt-3.5 text-[13px] leading-[1.4]", TONO_PIE[footerTone])}>{footer}</div>
    </Card>
  );
}

function ActivitiesTable({ rows, onExport }: { rows: ActividadPerf[]; onExport: () => void }) {
  return (
    <Card className="overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-outline-variant px-6 py-5">
        <div>
          <h2 className="m-0 font-display text-xl font-bold text-fg-1">Performance por actividad</h2>
          <p className="mt-1 mb-0 text-[13px] text-fg-3">Ranking de ocupación de tus experiencias en el período seleccionado.</p>
        </div>
        <Button variant="neutral" size="sm" onClick={onExport} disabled={rows.length === 0}><Download size={15} /> Exportar</Button>
      </div>

      {rows.length === 0 ? (
        <div className="px-6 py-14 text-center text-fg-3">
          <BarChart3 size={28} className="mx-auto text-fg-3" />
          <p className="mt-3 mb-0 text-sm">No hay actividades vigentes en este período.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-cream-tert text-left text-[11.5px] tracking-[.05em] text-fg-3 uppercase">
                <th className="px-6 py-3 font-semibold">Nombre actividad</th>
                <th className="w-[120px] px-3 py-3 text-right font-semibold">Cupos totales</th>
                <th className="w-[100px] px-3 py-3 text-right font-semibold">Reservas</th>
                <th className="w-[150px] px-3 py-3 text-right font-semibold">Ingresos del período</th>
                <th className="w-[240px] px-6 py-3 font-semibold">Ocupación</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((a) => {
                const Icono = iconoDe(a.cultivo || a.nombre);
                const color = colorDe(a.nombre);
                return (
                  <tr key={a.id} className="border-b border-cream-tert last:border-b-0">
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-3">
                        {/* El color es un dato derivado del nombre: va inline, como en los cultivos. */}
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-full" style={{ background: color }}>
                          <Icono size={18} className="text-white/90" />
                        </span>
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-fg-1">{a.nombre}</div>
                          {a.cultivo && <div className="mt-0.5 text-xs text-fg-3">{a.cultivo}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3.5 text-right font-mono font-medium text-fg-2">{a.cupos}</td>
                    <td className="px-3 py-3.5 text-right font-mono font-medium text-fg-2">{a.reservas}</td>
                    <td className="px-3 py-3.5 text-right font-mono font-semibold whitespace-nowrap text-fg-1">{moneyAr(a.ingresos)}</td>
                    <td className="px-6 py-3.5"><OccupancyBar value={a.ocupacion} color={color} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

const ALCANCES: { id: ExportOpts["scope"]; label: string; sub: string }[] = [
  { id: "performance", label: "Performance por actividad", sub: "Tabla con cupos, reservas y % de ocupación" },
  { id: "completo", label: "Reporte completo", sub: "Incluye KPIs, gráfico mensual y tabla" },
];

const FORMATOS: { id: ExportOpts["format"]; label: string; sub: string; Icon: LucideIcon }[] = [
  { id: "pdf", label: "PDF", sub: "Reporte con formato y gráficos", Icon: FileText },
  { id: "csv", label: "CSV", sub: "Datos tabulares, separado por comas", Icon: FileSpreadsheet },
  { id: "xlsx", label: "Excel", sub: "Hoja de cálculo .xlsx", Icon: Table2 },
];

/** Recuadro elegible del modal: borde de 2px cuando está activo, sin que el contenido salte. */
const opcion = (on: boolean) =>
  cn(
    "cursor-pointer rounded-md border-solid text-left",
    on ? "m-0 border-2 border-green-800 bg-green-050" : "m-px border border-outline-variant bg-surface hover:border-sand",
  );

function ExportModal({ busy, error, onClose, onConfirm }: { busy: boolean; error: string | null; onClose: () => void; onConfirm: (o: ExportOpts) => void }) {
  const [format, setFormat] = useState<ExportOpts["format"]>("pdf");
  const [scope, setScope] = useState<ExportOpts["scope"]>("performance");

  // TODO: `Modal` no maneja Escape; se va cuando pase al Dialog de Base UI.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && !busy) onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [busy, onClose]);

  return (
    <Modal onClose={onClose} dismissable={!busy} className="w-[520px]">
      <IconButton appearance="plain" onClick={onClose} disabled={busy} aria-label="Cerrar" className="absolute top-3.5 right-3.5"><X /></IconButton>
      <h3 className="mt-0 mb-2 font-display text-[22px] leading-tight font-semibold text-fg-1">Exportar reporte</h3>
      <p className="mt-0 mb-[22px] text-sm leading-normal text-fg-2">Vas a descargar los datos de performance del período seleccionado. Elegí qué incluir y en qué formato.</p>

      <div className="t-label mb-2.5">Contenido</div>
      <div className="mb-6 flex flex-col gap-2">
        {ALCANCES.map((s) => {
          const on = scope === s.id;
          return (
            <label key={s.id} className={cn(opcion(on), "flex items-start gap-3 p-3.5")}>
              <input type="radio" name="scope" checked={on} onChange={() => setScope(s.id)} className="mt-[3px] accent-green-800" />
              <span>
                <span className="block text-sm font-semibold text-fg-1">{s.label}</span>
                <span className="mt-0.5 block text-[12.5px] text-fg-3">{s.sub}</span>
              </span>
            </label>
          );
        })}
      </div>

      <div className="t-label mb-2.5">Formato</div>
      <div role="radiogroup" aria-label="Formato" className="mb-[26px] grid grid-cols-3 gap-2">
        {FORMATOS.map(({ id, label, sub, Icon }) => {
          const on = format === id;
          return (
            <button key={id} type="button" role="radio" aria-checked={on} onClick={() => setFormat(id)} className={cn(opcion(on), "flex flex-col items-start gap-1.5 px-3 py-3.5 font-sans")}>
              <Icon size={20} className={on ? "text-green-800" : "text-fg-2"} />
              <span className="text-sm font-semibold text-fg-1">{label}</span>
              <span className="text-[11.5px] leading-[1.3] text-fg-3">{sub}</span>
            </button>
          );
        })}
      </div>

      {error && <Alert tone="danger" className="mb-5">{error}</Alert>}

      <div className="flex justify-end gap-3">
        <Button variant="neutral" onClick={onClose} disabled={busy}>Cancelar</Button>
        <Button onClick={() => onConfirm({ format, scope })} loading={busy}>
          <Download size={17} /> Descargar
        </Button>
      </div>
    </Modal>
  );
}

/** Misma forma que el contenido, para que nada salte cuando llegan los números. */
function EstadisticasSkeleton() {
  return (
    <div aria-busy aria-label="Cargando estadísticas…">
      <div className="mb-6 grid grid-cols-1 gap-5 min-[961px]:grid-cols-[1.05fr_1fr_1fr]">
        {[0, 1, 2].map((i) => <Skeleton key={i} className="h-[262px] rounded-lg" />)}
      </div>
      <Skeleton className="mb-6 h-[352px] rounded-lg" />
      <Skeleton className="h-[360px] rounded-lg" />
    </div>
  );
}

export default function EstadisticasClient() {
  // El establecimiento activo lo elige el switcher del shell.
  const { activo } = useEstablecimientos();
  const establecimientoId = activo?.id ?? "";
  const accesos = useAuthStore((s) => s.accesos);
  // El backend sólo se las da al titular del establecimiento, que es su Productor Líder.
  const esLider = tieneRol(accesos, ROL_PRODUCTOR_LIDER, { tipoPermiso: TipoPermiso.PRODUCTOR, establecimientoId });

  const [period, setPeriod] = useState<Periodo>("6m");
  const { data, isLoading, error, reload } = useEstadisticas(esLider ? establecimientoId : "", period);
  const { exportar, isLoading: exporting } = useExportarReporte();
  const [exportOpen, setExportOpen] = useState(false);
  const [errorExport, setErrorExport] = useState<string | null>(null);

  if (!activo) return <EmptyEstablecimiento />;
  if (!esLider) return <SinPermiso motivo={SIN_ACCESO} />;

  async function onConfirmExport(opts: ExportOpts) {
    if (!data) return;
    setErrorExport(null);
    const { ok } = await exportar(opts, data, period, {
      establecimiento: activo?.nombre || "Establecimiento",
      periodo: labelPeriodo(period),
    });
    if (!ok) {
      // Falló desde el diálogo: queda abierto con lo elegido, y el aviso adentro.
      setErrorExport("No se pudo generar el reporte. Intentá nuevamente en unos minutos. Si el problema persiste, contactá a soporte.");
      return;
    }
    setExportOpen(false);
    notify.success(`Reporte generado en ${opts.format.toUpperCase()}`);
  }

  const label = labelPeriodo(period);

  return (
    <div className="mx-auto max-w-[1240px] px-7 pt-8 pb-20">
      {/* La cabecera no depende de los datos: se pinta desde el primer frame. */}
      <div className="mb-8 flex flex-wrap items-end justify-between gap-5">
        <div>
          <h1 className="m-0 font-display text-[32px] font-bold tracking-[-0.01em] text-fg-1">Estadísticas y reportes</h1>
          <p className="mt-1.5 mb-0 text-[15px] text-fg-2">
            Desempeño de tus experiencias en <strong className="text-fg-1">{label.toLowerCase()}</strong>
            {data?.actual.desde && <> · del {fmtFecha(data.actual.desde)} al {fmtFecha(data.actual.hasta)}</>}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <PeriodSelect value={period} onChange={setPeriod} />
          <Button onClick={() => setExportOpen(true)} disabled={!data}><Download size={17} /> Exportar reporte</Button>
        </div>
      </div>

      <AsyncBoundary loading={isLoading} error={error} onRetry={reload} skeleton={<EstadisticasSkeleton />}>
        {data && (() => {
          const { kpis, serie, actual, anterior } = data;
          const sube = (kpis.beneficiosDelta ?? 0) >= 0;
          return (
            <>
              <div className="mb-6 grid grid-cols-1 gap-5 min-[961px]:grid-cols-[1.05fr_1fr_1fr]">
                <KpiCard
                  title="Ocupación"
                  icon={Users}
                  footerTone={kpis.ocupacionFilled > 0 ? "success" : "neutral"}
                  footer={kpis.ocupacionTotal === 0
                    ? "Sin cupos ofertados en el período."
                    : kpis.ocupacionFilled === 0
                      ? "Sin reservas en el período."
                      : <><CheckCircle2 size={14} className="shrink-0" /> {kpis.ocupacionFilled} de {kpis.ocupacionTotal} cupos reservados</>}
                >
                  <Donut value={kpis.ocupacionPct} size={150} stroke={16} />
                </KpiCard>

                <KpiCard
                  title="Beneficios totales"
                  icon={Banknote}
                  footerTone={kpis.beneficiosDelta == null ? "neutral" : sube ? "success" : "danger"}
                  footer={kpis.beneficiosDelta == null
                    ? kpis.beneficios === 0
                      ? "Sin ingresos registrados."
                      : <><Info size={14} className="shrink-0" /> Sin ingresos en el período anterior para comparar.</>
                    : <>
                        {sube ? <TrendingUp size={14} className="shrink-0" /> : <TrendingDown size={14} className="shrink-0" />}
                        <span><strong>{fmtPctConSigno(kpis.beneficiosDelta)}</strong> respecto del período anterior{anterior && <span className="text-fg-3"> ({rango(anterior)})</span>}</span>
                      </>}
                >
                  <div className="text-center">
                    <div className="font-display text-[40px] leading-none font-bold tracking-[-0.01em] text-fg-1">{moneyAr(kpis.beneficios)}</div>
                    <div className="mt-2 font-mono text-[12.5px] text-fg-3">Pesos argentinos · neto</div>
                    {actual.desde && <div className="mt-1 font-mono text-xs text-fg-3">{rango(actual)}</div>}
                  </div>
                </KpiCard>

                <KpiCard
                  title="Cancelaciones"
                  icon={CalendarX}
                  footer={kpis.cancelacionCount === 0
                    ? "Sin cancelaciones."
                    : <><Info size={14} className="shrink-0" /> {kpis.cancelacionCount} {kpis.cancelacionCount === 1 ? "reserva cancelada" : "reservas canceladas"}</>}
                >
                  <div className="text-center">
                    <div className="font-display text-[56px] leading-none font-bold tracking-[-0.02em] text-fg-1">{kpis.cancelacionPct}<span className="ml-0.5 text-[0.5em] text-fg-2">%</span></div>
                    <div className="mt-2 font-mono text-[12.5px] text-fg-3">sobre el total de reservas</div>
                  </div>
                </KpiCard>
              </div>

              <Card className="mb-6 p-6">
                <div className="mb-[18px] flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h2 className="m-0 font-display text-xl font-bold text-fg-1">{serie.title || "Reservas totales"}</h2>
                    {serie.sub && <p className="mt-1 mb-0 text-[13px] text-fg-3">{serie.sub}</p>}
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-[12.5px] text-fg-2">
                    <div className="flex items-center gap-1.5"><span className="inline-block size-3 rounded-[3px] border-[1.5px] border-green-600 bg-[#EAF1E2]" /> Reservas confirmadas</div>
                    <div className="flex items-center gap-1.5"><span className="font-mono text-xs text-fg-3">$</span> Ganancia del período</div>
                  </div>
                </div>
                <BarChart data={serie.bars} height={260} />
              </Card>

              <ActivitiesTable rows={data.actividades} onExport={() => setExportOpen(true)} />
            </>
          );
        })()}
      </AsyncBoundary>

      {exportOpen && <ExportModal busy={exporting} error={errorExport} onClose={() => { setExportOpen(false); setErrorExport(null); }} onConfirm={onConfirmExport} />}
    </div>
  );
}
