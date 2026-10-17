"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight, CalendarDays, Check, ChevronRight, ClipboardList, FilePen, Plus, ReceiptText,
  TrendingDown, TrendingUp, User, Users, Wallet, ExternalLink,
} from "lucide-react";
import AsyncBoundary from "@/components/AsyncBoundary";
import DashboardSkeleton from "@/components/panel/DashboardSkeleton";
import { Card, EstadoBadge, Estrellas, Skeleton } from "@/components/ui";
import { buttonClasses } from "@/components/ui/Button";
import { useEstablecimientos, useRutaPanel } from "@/hooks/useEstablecimientos";
import { useEstadisticas } from "@/hooks/useEstadisticas";
import { usePanelResumen } from "@/hooks/usePanelResumen";
import {
  fmtCodigoReserva, fmtDiaLocal, fmtHoraLocal, fmtPctConSigno, fmtPuntaje, moneyAr, recortar,
} from "@/lib/format";
import { PermisoProductor, TipoPermiso } from "@/lib/permisos";
import { ROL_PRODUCTOR_LIDER, tienePermiso, tieneRol } from "@/lib/roles";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/authStore";
import type { DiaReservas, PendientesPanel, ReseniasPanel, ResumenPanel } from "@/types/panel";
import EmptyEstablecimiento from "../EmptyEstablecimiento";

/** Qué puede hacer la cuenta en el establecimiento activo: decide qué se ofrece. */
interface Alcance {
  actividades: boolean;
  reembolsos: boolean;
  lider: boolean;
}

const DIAS_SEMANA = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

const p2 = (x: number) => String(x).padStart(2, "0");

/** "AAAA-MM-DD" de un `Date` en hora local. */
const isoLocal = (d: Date) => `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`;

/** "Hoy", "Mañana" o el día de la semana, para la cabecera de cada día. */
function nombreDia(fecha: string, hoy: Date): string {
  const manana = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + 1);
  if (fecha === isoLocal(hoy)) return "Hoy";
  if (fecha === isoLocal(manana)) return "Mañana";
  const [y, m, d] = fecha.split("-").map(Number);
  return DIAS_SEMANA[new Date(y, m - 1, d).getDay()];
}

function saludo(hora: number): string {
  if (hora < 13) return "Buen día";
  if (hora < 20) return "Buenas tardes";
  return "Buenas noches";
}

/** "hace 3 días", contando días de calendario. */
function haceDias(d: Date, hoy: Date): string {
  const dias = Math.round(
    (new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()).getTime()
      - new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()) / 86_400_000,
  );
  if (dias <= 0) return "hoy";
  if (dias === 1) return "ayer";
  return `hace ${dias} días`;
}

const plural = (n: number, uno: string, varios: string) => `${n} ${n === 1 ? uno : varios}`;

/* ---- Encabezado y accesos rápidos ----------------------------------------- */

function Encabezado({ nombre, establecimiento, hoy }: { nombre: string; establecimiento: string; hoy: Date }) {
  const primerNombre = nombre.trim().split(/\s+/)[0];
  return (
    <div className="mb-6">
      <h1 className="m-0 font-display text-[32px] font-bold tracking-[-.01em] text-fg-1">
        {saludo(hoy.getHours())}{primerNombre ? `, ${primerNombre}` : ""}
      </h1>
      <p className="mt-1.5 text-[15px] text-fg-2">
        <span className="font-mono text-sm">{DIAS_SEMANA[hoy.getDay()]} {fmtDiaLocal(hoy)}</span> · {establecimiento}
      </p>
    </div>
  );
}

interface Acceso {
  icon: LucideIcon;
  label: string;
  href: string;
  primary?: boolean;
}

function AccesosRapidos({ alcance }: { alcance: Alcance }) {
  const ruta = useRutaPanel();
  const accesos: Acceso[] = [
    ...(alcance.actividades
      ? [
          { icon: Plus, label: "Cargá una actividad", href: ruta("actividades", "crear"), primary: true },
          { icon: CalendarDays, label: "Tus actividades", href: ruta("actividades") },
        ]
      : []),
    { icon: ClipboardList, label: "Reservas recibidas", href: ruta("reservas") },
  ];

  return (
    // Una sola fila, con tantas columnas como accesos haya según los permisos.
    <div className="mb-6 grid auto-cols-fr grid-flow-col gap-3">
      {accesos.map((a) => (
        <Link
          key={a.label}
          href={a.href}
          className={cn(
            "flex items-center gap-2.5 rounded-md border px-3 py-3.5 no-underline sm:gap-3 sm:px-4 transition-[box-shadow,border-color] duration-150 hover:no-underline hover:shadow-hover active:translate-y-px",
            a.primary
              ? "border-green-800 bg-green-800 text-white shadow-[inset_0_-2px_0_var(--green-900)] hover:text-white"
              : "border-outline-variant bg-surface text-fg-1 hover:border-sand hover:text-fg-1",
          )}
        >
          <span className={cn("hidden size-9 shrink-0 items-center justify-center rounded-lg sm:flex", a.primary ? "bg-white/15" : "bg-green-050")}>
            <a.icon size={18} className={a.primary ? "text-white" : "text-green-800"} />
          </span>
          <span className="min-w-0 flex-1 text-[14.5px] leading-tight font-semibold">{a.label}</span>
          {/* La de crear ya se lee como acción; las demás llevan a otra pantalla. */}
          {!a.primary && <ArrowRight size={16} className="shrink-0 text-fg-3" />}
        </Link>
      ))}
    </div>
  );
}

/* ---- Requiere tu atención -------------------------------------------------- */

type Tono = "danger" | "warning" | "info";

const TONO: Record<Tono, { fill: string; fg: string }> = {
  danger: { fill: "bg-danger-fill", fg: "text-danger-fg" },
  warning: { fill: "bg-warning-fill", fg: "text-warning-fg" },
  info: { fill: "bg-info-fill", fg: "text-info-fg" },
};

interface Pendiente {
  icon: LucideIcon;
  tono: Tono;
  /** Sin número cuando es un estado (la cuenta de Mercado Pago), no una cantidad. */
  n?: number;
  label: string;
  sub: string;
  href: string;
}

function armarPendientes(p: PendientesPanel, alcance: Alcance, ruta: (...partes: string[]) => string, hoy: Date): Pendiente[] {
  const items: Pendiente[] = [];
  // Mercado Pago lo vincula el titular desde "Datos", que es sólo del Líder.
  if (alcance.lider && !p.mercadoPagoVinculado) {
    items.push({
      icon: Wallet, tono: "danger", label: "Vinculá Mercado Pago",
      sub: "Sin una cuenta vinculada no podés recibir reservas", href: ruta("datos"),
    });
  } else if (alcance.lider && p.mercadoPagoTokenExpira && p.mercadoPagoTokenExpira < hoy) {
    // El backend renueva la autorización todos los días: si igual venció, la
    // renovación falló y hay que volver a vincular.
    items.push({
      icon: Wallet, tono: "danger", label: "Mercado Pago desvinculado",
      sub: "La autorización venció. Volvé a vincular la cuenta", href: ruta("datos"),
    });
  }
  if (alcance.reembolsos && p.reembolsos > 0) {
    items.push({
      icon: ReceiptText, tono: "warning", n: p.reembolsos,
      label: p.reembolsos === 1 ? "Reembolso pendiente" : "Reembolsos pendientes",
      sub: p.reembolsoMasAntiguo
        ? `${p.reembolsos === 1 ? "Pedido" : "El más antiguo,"} ${haceDias(p.reembolsoMasAntiguo, hoy)}`
        : "Mercado Pago no pudo devolverlos",
      href: ruta("reembolsos"),
    });
  }
  if (alcance.actividades && p.borradores > 0) {
    items.push({
      icon: FilePen, tono: "info", n: p.borradores,
      label: p.borradores === 1 ? "Actividad en borrador" : "Actividades en borrador",
      sub: "Publicalas para empezar a recibir reservas", href: ruta("actividades"),
    });
  }
  return items;
}

function Pendientes({ items }: { items: Pendiente[] }) {
  if (!items.length) {
    return (
      <Card className="mb-6 flex items-center gap-3 px-6 py-4">
        <span className="flex size-8 items-center justify-center rounded-full bg-success-fill">
          <Check size={16} className="text-success-fg" />
        </span>
        <div className="text-[14.5px] font-semibold text-fg-1">Todo al día. No tenés pendientes por resolver.</div>
      </Card>
    );
  }
  const total = items.reduce((s, i) => s + (i.n ?? 1), 0);
  return (
    <Card className="mb-6">
      <div className="px-6 pt-5 pb-2">
        <h2 className="t-label m-0">Requiere tu atención · {total}</h2>
      </div>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-1 px-2 pb-3">
        {items.map((p) => (
          <Link
            key={p.label}
            href={p.href}
            className="flex items-center gap-3 rounded-md px-4 py-3 text-fg-1 no-underline hover:bg-cream-tert hover:text-fg-1 hover:no-underline"
          >
            <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg", TONO[p.tono].fill)}>
              <p.icon size={18} className={TONO[p.tono].fg} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold">
                {p.n !== undefined && <span className={cn("mr-1.5 font-mono", TONO[p.tono].fg)}>{p.n}</span>}
                {p.label}
              </span>
              <span className="mt-0.5 block text-[12.5px] text-fg-3">{p.sub}</span>
            </span>
            <ChevronRight size={16} className="text-fg-3" />
          </Link>
        ))}
      </div>
    </Card>
  );
}

/* ---- Próximas reservas ----------------------------------------------------- */

const CABECERA = "flex flex-wrap items-center justify-between gap-4 px-6 pt-5";
const TITULO = "m-0 font-display text-xl font-semibold text-fg-1";
const LINK_CABECERA = "inline-flex items-center gap-1 text-[13.5px] font-semibold";

function ProximasReservas({ dias, alcance, hoy }: { dias: DiaReservas[]; alcance: Alcance; hoy: Date }) {
  const ruta = useRutaPanel();
  const total = dias.reduce((s, d) => s + d.reservas.length, 0);

  return (
    <Card className="overflow-hidden">
      <div className={cn(CABECERA, "pb-5")}>
        <div>
          <h2 className={TITULO}>Próximas reservas</h2>
          <p className="mt-1 text-[13px] text-fg-3">
            {total ? `${plural(total, "reserva", "reservas")} en los próximos 3 días` : "Próximos 3 días"}
          </p>
        </div>
        <Link href={ruta("reservas")} className={LINK_CABECERA}>
          Ver reservas <ArrowRight size={14} />
        </Link>
      </div>

      {!total ? (
        <div className="border-t border-cream-tert px-6 py-12 text-center text-fg-3">
          <CalendarDays size={28} className="mx-auto" />
          <p className="mt-3 mb-4 text-sm">No tenés reservas en los próximos días.</p>
          {alcance.actividades && (
            <Link href={ruta("actividades")} className={buttonClasses({ variant: "neutral", size: "sm" })}>
              Revisá tus actividades
            </Link>
          )}
        </div>
      ) : dias.map((d) => (
        <div key={d.fecha}>
          <div className="flex items-baseline gap-2 border-t border-outline-variant bg-cream-tert px-6 py-2.5">
            <span className="text-[13.5px] font-semibold text-fg-1">{nombreDia(d.fecha, hoy)}</span>
            <span className="font-mono text-[12.5px] text-fg-3">{d.fecha.slice(8, 10)}/{d.fecha.slice(5, 7)}</span>
            <span className="ml-auto text-[12.5px] text-fg-3">
              {plural(d.reservas.reduce((s, r) => s + r.personas, 0), "visitante", "visitantes")}
            </span>
          </div>
          {d.reservas.map((r) => {
            const contenido = (
              <>
                <span className="font-mono text-[15px] font-semibold text-fg-1">{r.inicio ? fmtHoraLocal(r.inicio) : "—"}</span>
                <span className="min-w-0">
                  <span className="block text-[14.5px] font-semibold">{r.actividad || "Actividad"}</span>
                  <span className="mt-[3px] flex flex-wrap gap-x-3 gap-y-1 text-[13px] text-fg-2">
                    {r.visitante && (
                      <span className="inline-flex items-center gap-[5px]"><User size={13} className="text-fg-3" />{r.visitante}</span>
                    )}
                    <span className="inline-flex items-center gap-[5px]">
                      <Users size={13} className="text-fg-3" />{plural(r.personas, "persona", "personas")}
                    </span>
                    <span className="font-mono text-xs text-fg-3" title={r.id}>{fmtCodigoReserva(r.id)}</span>
                  </span>
                </span>
                <span className="col-start-2 sm:col-start-auto">
                  {/* El resumen trae sólo reservas pagadas. */}
                  <EstadoBadge tone="success">Confirmada</EstadoBadge>
                </span>
              </>
            );
            const fila = "grid grid-cols-[52px_minmax(0,1fr)] items-center gap-4 border-t border-cream-tert px-4 py-3.5 text-inherit no-underline sm:grid-cols-[64px_minmax(0,1fr)_auto] sm:px-6";
            // Las reservas del día viven en el calendario de la actividad, que pide gestionarla.
            return alcance.actividades && r.actividadId && r.actividadDiaId ? (
              <Link
                key={r.id}
                href={ruta("actividades", r.actividadId, "calendario", r.actividadDiaId)}
                className={cn(fila, "hover:bg-green-050 hover:text-inherit hover:no-underline")}
              >
                {contenido}
              </Link>
            ) : (
              <div key={r.id} className={fila}>{contenido}</div>
            );
          })}
        </div>
      ))}
    </Card>
  );
}

/* ---- Últimos 30 días ------------------------------------------------------- */

interface Kpi {
  label: string;
  value: string;
  pie: string;
  /** `true` sube, `false` baja, `null` es un dato sin comparación. */
  sube: boolean | null;
}

function Ultimos30Dias({ establecimientoId }: { establecimientoId: string }) {
  const ruta = useRutaPanel();
  const { data, isLoading, error, reload } = useEstadisticas(establecimientoId, "30d");

  const k = data?.kpis;
  const kpis: Kpi[] = k
    ? [
        { label: "Cupos vendidos", value: String(k.ocupacionFilled), pie: `de ${k.ocupacionTotal} ofrecidos`, sube: null },
        { label: "Ocupación media", value: `${k.ocupacionPct}%`, pie: "de los cupos publicados", sube: null },
        {
          label: "Ingresos",
          value: moneyAr(k.beneficios),
          pie: k.beneficiosDelta === null ? "Sin período anterior" : `${fmtPctConSigno(k.beneficiosDelta)} vs. 30 días previos`,
          sube: k.beneficiosDelta === null || k.beneficiosDelta === 0 ? null : k.beneficiosDelta > 0,
        },
        { label: "Cancelaciones", value: `${k.cancelacionPct}%`, pie: plural(k.cancelacionCount, "reserva cancelada", "reservas canceladas"), sube: null },
      ]
    : [];

  return (
    <Card>
      <div className={cn(CABECERA, "pb-3")}>
        <h2 className={TITULO}>Últimos 30 días</h2>
        <Link href={ruta("estadisticas")} className={LINK_CABECERA}>
          Estadísticas <ArrowRight size={14} />
        </Link>
      </div>
      {isLoading ? (
        <div className="grid grid-cols-2 border-t border-cream-tert">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="px-6 pt-4 pb-[18px]">
              <Skeleton className="h-3.5 w-24" />
              <Skeleton className="mt-2.5 h-7 w-20" />
              <Skeleton className="mt-2 h-3.5 w-28" />
            </div>
          ))}
        </div>
      ) : error || !k ? (
        <div className="border-t border-cream-tert px-6 py-6 text-center text-sm text-fg-3">
          No pudimos cargar los números.{" "}
          <button type="button" onClick={reload} className="cursor-pointer border-none bg-transparent p-0 font-semibold text-green-800 underline">
            Reintentar
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 border-t border-cream-tert">
          {kpis.map((kpi, i) => (
            <div
              key={kpi.label}
              className={cn("min-w-0 px-6 pt-4 pb-[18px]", i % 2 === 0 && "border-r border-cream-tert", i < 2 && "border-b border-cream-tert")}
            >
              <div className="text-[12.5px] font-medium text-fg-3">{kpi.label}</div>
              <div className="mt-1.5 truncate font-display text-[26px] leading-tight font-bold text-fg-1">{kpi.value}</div>
              <div
                className={cn(
                  "mt-1 flex items-center gap-1 text-[12.5px]",
                  kpi.sube === true ? "text-success-fg" : kpi.sube === false ? "text-danger-fg" : "text-fg-2",
                )}
              >
                {kpi.sube !== null && (kpi.sube ? <TrendingUp size={13} /> : <TrendingDown size={13} />)}
                {kpi.pie}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

/* ---- Reseñas --------------------------------------------------------------- */

function Resenias({ resenias, establecimientoId }: { resenias: ReseniasPanel; establecimientoId: string }) {
  return (
    <Card>
      <div className={cn(CABECERA, "pb-3")}>
        <h2 className={TITULO}>Últimas reseñas</h2>
        <Link href={`/establecimientos/${encodeURIComponent(establecimientoId)}`} className={LINK_CABECERA}>
          Tu página <ExternalLink size={14} />
        </Link>
      </div>
      {resenias.promedio === null || !resenias.ultimas.length ? (
        <div className="border-t border-cream-tert px-6 py-6 text-center text-sm text-fg-3">
          Todavía no recibiste reseñas. Aparecen cuando un visitante califica una actividad.
        </div>
      ) : (
        <>
          <div className="flex items-center gap-3 border-t border-cream-tert px-6 py-3.5">
            <span className="font-display text-[26px] leading-none font-bold text-fg-1">{fmtPuntaje(resenias.promedio)}</span>
            <span>
              <Estrellas valor={resenias.promedio} />
              <span className="block text-[12.5px] text-fg-3">{plural(resenias.total, "reseña", "reseñas")}</span>
            </span>
          </div>
          {resenias.ultimas.map((r, i) => (
            <div key={i} className="border-t border-cream-tert px-6 py-3">
              <div className="flex items-center justify-between gap-3">
                <Estrellas valor={r.puntaje} size={13} />
                {r.fecha && <span className="font-mono text-xs text-fg-3">{fmtDiaLocal(r.fecha)}</span>}
              </div>
              {r.texto && <p className="mt-1.5 mb-0 text-sm text-fg-1">{recortar(r.texto, 140)}</p>}
              <div className="mt-1 text-[12.5px] text-fg-3">
                {[r.visitante, r.actividad].filter(Boolean).join(" · ")}
              </div>
            </div>
          ))}
        </>
      )}
    </Card>
  );
}

/* ---- Pantalla -------------------------------------------------------------- */

function Inicio({ resumen, alcance, establecimiento }: {
  resumen: ResumenPanel;
  alcance: Alcance;
  establecimiento: { id: string; nombre: string };
}) {
  const nombre = useAuthStore((s) => s.nombre) ?? "";
  const ruta = useRutaPanel();
  // Se monta recién con los datos, ya en el cliente: la fecha no puede diferir
  // entre el render del servidor y el del navegador.
  const hoy = new Date();

  return (
    <div className="mx-auto max-w-[1240px] px-4 pt-8 pb-20 sm:px-7">
      <Encabezado nombre={nombre} establecimiento={establecimiento.nombre} hoy={hoy} />
      <AccesosRapidos alcance={alcance} />
      <Pendientes items={armarPendientes(resumen.pendientes, alcance, ruta, hoy)} />
      <div className="grid items-start gap-6 min-[1100px]:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]">
        <ProximasReservas dias={resumen.proximas} alcance={alcance} hoy={hoy} />
        <div className="flex min-w-0 flex-col gap-6">
          {alcance.lider && <Ultimos30Dias establecimientoId={establecimiento.id} />}
          <Resenias resenias={resumen.resenias} establecimientoId={establecimiento.id} />
        </div>
      </div>
    </div>
  );
}

export default function PanelClient() {
  // El establecimiento activo lo elige el switcher del shell.
  const { activo, listo } = useEstablecimientos();
  const establecimientoId = activo?.id ?? "";
  const accesos = useAuthStore((s) => s.accesos);
  const { data, isLoading, error, reload } = usePanelResumen(establecimientoId);

  // Hasta que rehidrata la sesión, un `activo` en null no quiere decir nada.
  if (!activo) return listo ? <EmptyEstablecimiento /> : <DashboardSkeleton />;

  const ambito = { tipoPermiso: TipoPermiso.PRODUCTOR, establecimientoId };
  const alcance: Alcance = {
    actividades: tienePermiso(accesos, PermisoProductor.GESTIONAR_ACTIVIDAD, ambito),
    reembolsos: tienePermiso(accesos, PermisoProductor.GESTIONAR_REEMBOLSOS_PENDIENTES, ambito),
    // Las estadísticas y los datos del establecimiento son sólo del Líder.
    lider: tieneRol(accesos, ROL_PRODUCTOR_LIDER, ambito),
  };

  return (
    <AsyncBoundary loading={isLoading} error={error} onRetry={reload} skeleton={<DashboardSkeleton />}>
      {data && <Inicio resumen={data} alcance={alcance} establecimiento={activo} />}
    </AsyncBoundary>
  );
}
