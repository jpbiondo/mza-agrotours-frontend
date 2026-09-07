"use client";

import { Fragment, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  AlertCircle, AlertTriangle, Ban, CalendarCheck, Check, ChevronRight, Clock, Grape,
  List as ListIcon, Loader, MapPin, RotateCcw, Search, SearchX, User, Warehouse,
} from "lucide-react";
import AsyncBoundary from "@/components/AsyncBoundary";
import { ActionBtn, Alert, Button, Card, EstadoBadge, IconCircle, Modal, Skeleton, Toast } from "@/components/ui";
import type { ToastData } from "@/components/ui";
import { TextField } from "@/components/ui/text-field";
import { estabInitials } from "@/data/admin";
import { fmtFecha, fmtFechaHora } from "@/lib/format";
import { PermisoAdmin } from "@/lib/permisos";
import { tienePermiso } from "@/lib/roles";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/authStore";
import { useEstablecimientosAdmin, useModerarEstablecimiento } from "@/hooks/useEstablecimientosAdmin";
import type { AdminEstab, EstadoAdminEstab } from "@/types/admin";

const SIN_GESTION = "Necesitás el permiso de gestión de establecimientos";
const MOTIVO_MIN = 15;
const MOTIVO_MAX = 280;

/**
 * Errores de dominio de la moderación. Los tres primeros son carreras contra
 * otro administrador, así que el mensaje empuja a recargar en vez de reintentar.
 */
const ERROR_MODERAR: Record<string, string> = {
  "AS.establecimientoNotFound": "No encontramos el establecimiento. Puede que lo hayan dado de baja.",
  "AS.establecimientoNoActivo": "El establecimiento ya no está activo. Actualizá la lista para ver su estado.",
  "AS.establecimientoNoSuspendido": "El establecimiento ya no está suspendido. Actualizá la lista para ver su estado.",
};

function mensajeModerar(code: string | undefined, suspendiendo: boolean): string {
  return (
    (code && ERROR_MODERAR[code]) ||
    (suspendiendo
      ? "No pudimos suspender el establecimiento. Probá de nuevo en unos minutos."
      : "No pudimos reactivar el establecimiento. Probá de nuevo en unos minutos.")
  );
}

/**
 * "Suspendido el 01/09/2026 · 12:43 · por Ana Pérez". El ejecutor falta cuando
 * el cambio no lo hizo un administrador y la fecha puede no venir, así que se
 * omite lo que falte; sin ninguno de los dos no se dibuja la línea.
 */
function selloDe(e: AdminEstab): string {
  if (!e.fechaEstado && !e.ejecutorEstado) return "";
  return [
    "Suspendido",
    e.fechaEstado && `el ${fmtFechaHora(e.fechaEstado)}`,
    e.ejecutorEstado && `· por ${e.ejecutorEstado}`,
  ]
    .filter(Boolean)
    .join(" ");
}

/* ---- Cáscara de la tabla -------------------------------------------------
   La comparten el esqueleto y la tabla con datos, y los anchos van fijos: con
   el layout automático las columnas se recalculan al llegar los datos y salta
   todo, sobre todo Acciones, que va alineada a la derecha. */

const COLUMNAS = ["Establecimiento", "Ubicación", "Actividad", "Alta", "Estado", "Acciones"];
const ANCHOS = [undefined, "w-[190px]", "w-[150px]", "w-[120px]", "w-[130px]", "w-[180px]"];

function Tabla({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1040px] table-fixed border-collapse">
        <colgroup>
          {ANCHOS.map((w, i) => (
            <col key={i} className={w} />
          ))}
        </colgroup>
        <thead>
          <tr>
            {COLUMNAS.map((h, i) => (
              <th
                key={h}
                className={cn(
                  "border-b-2 border-outline-variant px-4 py-3.5 text-[12.5px] font-bold tracking-[.05em] whitespace-nowrap text-fg-2 uppercase",
                  i === 2 ? "text-center" : i === 5 ? "text-right" : "text-left",
                )}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        {children}
      </table>
    </div>
  );
}

/** Actividades publicadas y reservas históricas de la finca. */
function ContadoresActividad({ estab }: { estab: AdminEstab }) {
  const items = [
    { Icono: Grape, color: "text-green-700", valor: estab.actividades, title: "Actividades publicadas" },
    { Icono: CalendarCheck, color: "text-brown-700", valor: estab.reservas, title: "Reservas históricas" },
  ];
  return (
    <div className="inline-flex items-center gap-3.5">
      {items.map((c) => (
        <span
          key={c.title}
          title={c.title}
          className={cn(
            "inline-flex items-center gap-1.5 font-mono text-sm font-bold",
            // En cero el número no aporta nada y compite con los que sí.
            c.valor > 0 ? "text-fg-1" : "text-fg-3",
          )}
        >
          <c.Icono className={cn("size-[15px]", c.valor > 0 ? c.color : "text-fg-3")} />
          {c.valor}
        </span>
      ))}
    </div>
  );
}

/* ---- Esqueleto ----------------------------------------------------------- */

const ANCHOS_SKELETON = ["w-[150px]", "w-[124px]", "w-[168px]", "w-[136px]", "w-[112px]"];

function EstablecimientosSkeleton() {
  return (
    <div className="mx-auto max-w-[1240px] px-7 pt-7 pb-[72px]" aria-busy>
      <span role="status" className="sr-only">
        Cargando establecimientos…
      </span>

      <PageHead />

      {/* "—" y no cero: "0 establecimientos" es una afirmación, y todavía no
          sabemos nada. */}
      <Stats activos="—" suspendidos="—" total="—" hayAlerta={false} />
      <Filtros query="" onQuery={() => {}} filtro="todos" onFiltro={() => {}} disabled />

      <Card className="overflow-hidden p-0">
        <Tabla>
          <tbody>
            {ANCHOS_SKELETON.map((w, i) => (
              <tr key={i} className="border-b border-cream-tert">
                <td className="p-4 align-middle">
                  <div className="flex items-center gap-3.5">
                    <Skeleton className="size-[46px] rounded-[10px]" />
                    <div className="flex flex-col gap-2">
                      <Skeleton className={cn("h-4", w)} />
                      <Skeleton className="h-3 w-[96px]" />
                    </div>
                  </div>
                </td>
                <td className="p-4 align-middle">
                  <Skeleton className="h-4 w-[118px]" />
                </td>
                <td className="p-4 align-middle">
                  <Skeleton className="mx-auto h-4 w-[76px]" />
                </td>
                <td className="p-4 align-middle">
                  <Skeleton className="h-4 w-[84px]" />
                </td>
                <td className="p-4 align-middle">
                  <Skeleton className="h-[26px] w-[78px] rounded-pill" />
                </td>
                <td className="p-4 align-middle">
                  <Skeleton className="ml-auto h-[38px] w-[124px]" />
                </td>
              </tr>
            ))}
          </tbody>
        </Tabla>
      </Card>
    </div>
  );
}

/* ---- Cabecera, métricas y filtros ---------------------------------------- */

function PageHead() {
  return (
    <>
      <div className="mb-3.5 flex items-center gap-2.5 text-[13.5px] text-fg-3">
        <span>Plataforma</span>
        <ChevronRight className="size-[15px]" />
        <span className="font-medium text-fg-2">Establecimientos</span>
      </div>
      <div className="mb-6">
        <h1 className="font-display text-[32px] font-bold tracking-[-.01em] text-fg-1">
          Establecimientos
        </h1>
        <p className="mt-2.5 max-w-[680px] text-[15.5px] leading-relaxed text-fg-2">
          Supervisá los establecimientos de la plataforma. Podés suspender los que incumplan las
          normas — siempre con un motivo — y reactivarlos cuando regularicen su situación.
        </p>
      </div>
    </>
  );
}

function Stats({
  activos,
  suspendidos,
  total,
  hayAlerta,
}: {
  activos: ReactNode;
  suspendidos: ReactNode;
  total: ReactNode;
  hayAlerta: boolean;
}) {
  const items = [
    { Icono: Warehouse, label: "Establecimientos activos", value: activos, alerta: false },
    { Icono: Ban, label: "Suspendidos", value: suspendidos, alerta: hayAlerta },
    { Icono: ListIcon, label: "Total en la plataforma", value: total, alerta: false },
  ];
  return (
    <div className="mb-5 flex flex-wrap gap-3.5">
      {items.map((s) => (
        <Card key={s.label} className="flex min-w-[190px] items-center gap-3 px-4 py-3">
          <span
            className={cn(
              "flex size-[42px] shrink-0 items-center justify-center rounded-[10px]",
              s.alerta ? "bg-danger-fill" : "bg-green-050",
            )}
          >
            <s.Icono className={cn("size-5", s.alerta ? "text-danger" : "text-green-800")} />
          </span>
          <span>
            <span className="block font-mono text-xl font-bold text-fg-1">{s.value}</span>
            <span className="block text-[12.5px] text-fg-2">{s.label}</span>
          </span>
        </Card>
      ))}
    </div>
  );
}

type Filtro = "todos" | "activos" | "suspendidos";

function Filtros({
  query,
  onQuery,
  filtro,
  onFiltro,
  disabled,
}: {
  query: string;
  onQuery: (v: string) => void;
  filtro: Filtro;
  onFiltro: (f: Filtro) => void;
  /** El esqueleto dibuja los mismos controles apagados, para que no salte el bloque. */
  disabled?: boolean;
}) {
  const opciones: [Filtro, string][] = [
    ["todos", "Todos"],
    ["activos", "Activos"],
    ["suspendidos", "Suspendidos"],
  ];
  return (
    <div className="mb-4 flex flex-wrap items-center gap-3">
      <div className="min-w-[240px] flex-1">
        <TextField
          value={query}
          onChange={onQuery}
          icon={<Search />}
          placeholder="Buscar por nombre, productor líder o departamento"
          disabled={disabled}
        />
      </div>
      <div className="flex flex-wrap gap-2">
        {opciones.map(([val, label]) => {
          const on = filtro === val;
          return (
            <button
              key={val}
              type="button"
              disabled={disabled}
              onClick={() => onFiltro(val)}
              className={cn(
                "rounded-pill border px-[15px] py-2.5 text-[13.5px] font-semibold whitespace-nowrap transition-colors",
                disabled ? "cursor-default" : "cursor-pointer",
                on
                  ? "border-green-800 bg-green-800 text-fg-on-dark"
                  : "border-outline-variant bg-surface text-fg-2 hover:bg-cream-tert",
              )}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ---- Diálogos ------------------------------------------------------------ */

function SuspenderModal({
  estab,
  busy,
  error,
  onCancel,
  onConfirm,
}: {
  estab: AdminEstab;
  busy: boolean;
  /** Rechazo del backend: el diálogo queda abierto con lo escrito. */
  error: string | null;
  onCancel: () => void;
  onConfirm: (motivo: string) => void;
}) {
  const [motivo, setMotivo] = useState("");
  const [intentado, setIntentado] = useState(false);

  const limpio = motivo.trim();
  const err = !limpio
    ? "Escribí el motivo de la suspensión."
    : limpio.length < MOTIVO_MIN
      ? `El motivo debe tener al menos ${MOTIVO_MIN} caracteres.`
      : "";
  const mostrarErr = intentado && !!err;

  return (
    <Modal onClose={onCancel} dismissable={!busy}>
      <div className="flex items-center gap-3.5">
        <IconCircle tone="danger">
          <Ban className="size-[22px] text-danger" />
        </IconCircle>
        <div className="min-w-0">
          <h3 className="font-display text-xl font-bold text-fg-1">Suspender establecimiento</h3>
          <div className="mt-0.5 truncate text-[13.5px] text-fg-2">
            {estab.nombre}
            {estab.productorLider && ` · ${estab.productorLider}`}
          </div>
        </div>
      </div>

      <p className="mt-3.5 text-[14.5px] leading-relaxed text-fg-2">
        El establecimiento dejará de aparecer en la exploración y no podrá recibir nuevas reservas.
        El titular verá el motivo que registres acá.
      </p>

      <Alert tone="danger" icon={<Clock size={17} />} className="mt-3.5">
        <strong className="font-bold">Duración:</strong> la suspensión no tiene fecha de
        vencimiento. Se mantiene hasta que un administrador la reactive manualmente.
      </Alert>

      <label
        htmlFor="susp-motivo"
        className="mt-[18px] mb-2 block font-display text-[15.5px] font-semibold text-fg-1"
      >
        Motivo de la suspensión <span className="text-danger">*</span>
      </label>
      {/* Sin primitivo de textarea todavía: usa la clase del design system. */}
      <textarea
        id="susp-motivo"
        rows={4}
        autoFocus
        maxLength={MOTIVO_MAX}
        value={motivo}
        onChange={(e) => setMotivo(e.target.value)}
        aria-invalid={mostrarErr || undefined}
        aria-describedby="susp-motivo-ayuda"
        placeholder="Ej. Reiteradas cancelaciones sin reembolso a los visitantes."
        className={cn("textarea min-h-[96px] text-[15px]", mostrarErr && "err")}
      />
      <div className="mt-[7px] flex items-center justify-between gap-3">
        {mostrarErr ? (
          <span className="err-msg text-[12.5px]">
            <AlertCircle className="size-[15px] text-danger" /> {err}
          </span>
        ) : (
          <span id="susp-motivo-ayuda" className="text-xs text-fg-3">
            Quedará registrado junto con la fecha.
          </span>
        )}
        <span className="shrink-0 font-mono text-xs text-fg-3">
          {motivo.length}/{MOTIVO_MAX}
        </span>
      </div>

      {error && <Alert className="mt-4">{error}</Alert>}

      <div className="mt-6 flex justify-end gap-3">
        <Button variant="neutral" onClick={onCancel} disabled={busy}>
          Cancelar
        </Button>
        <Button
          variant="danger"
          disabled={busy}
          onClick={() => {
            setIntentado(true);
            if (!err) onConfirm(limpio);
          }}
        >
          {busy ? <Loader className="size-[17px] spin" /> : <Ban className="size-[17px]" />}
          Suspender establecimiento
        </Button>
      </div>
    </Modal>
  );
}

function ReactivarModal({
  estab,
  busy,
  error,
  onCancel,
  onConfirm,
}: {
  estab: AdminEstab;
  busy: boolean;
  error: string | null;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal onClose={onCancel} dismissable={!busy}>
      <div className="flex items-center gap-3.5">
        <IconCircle tone="success">
          <RotateCcw className="size-[22px] text-green-800" />
        </IconCircle>
        <h3 className="font-display text-xl font-bold text-fg-1">Reactivar establecimiento</h3>
      </div>
      <p className="mt-4 text-[15px] leading-relaxed text-fg-2">
        <strong className="font-semibold text-fg-1">{estab.nombre}</strong> volverá a aparecer en la
        exploración y podrá recibir reservas nuevamente.
      </p>
      {error && <Alert className="mt-4">{error}</Alert>}
      <div className="mt-6 flex justify-end gap-3">
        <Button variant="neutral" onClick={onCancel} disabled={busy}>
          No, volver
        </Button>
        <Button onClick={onConfirm} disabled={busy}>
          {busy ? <Loader className="size-[17px] spin" /> : <Check className="size-[17px]" />}
          Sí, reactivar
        </Button>
      </div>
    </Modal>
  );
}

/* ---- Pantalla ------------------------------------------------------------ */

function Pantalla({
  initial,
  gestionar,
}: {
  initial: AdminEstab[];
  gestionar: boolean;
}) {
  const [estabs, setEstabs] = useState<AdminEstab[]>(initial);
  const [aSuspender, setASuspender] = useState<AdminEstab | null>(null);
  const [aReactivar, setAReactivar] = useState<AdminEstab | null>(null);
  const [errorModal, setErrorModal] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastData | null>(null);
  const [query, setQuery] = useState("");
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const { suspender, reactivar, isLoading } = useModerarEstablecimiento();

  const activos = estabs.filter((e) => e.estado === "activo").length;
  const suspendidos = estabs.length - activos;

  function avisar(title: string) {
    const data: ToastData = { tone: "success", title };
    setToast(data);
    setTimeout(() => setToast((t) => (t === data ? null : t)), 3400);
  }

  const visibles = useMemo(() => {
    const q = query.trim().toLowerCase();
    return estabs.filter((e) => {
      if (filtro === "activos" && e.estado !== "activo") return false;
      if (filtro === "suspendidos" && e.estado !== "suspendido") return false;
      if (
        q &&
        !(
          e.nombre.toLowerCase().includes(q) ||
          e.productorLider.toLowerCase().includes(q) ||
          e.departamento.toLowerCase().includes(q)
        )
      )
        return false;
      return true;
    });
  }, [estabs, query, filtro]);

  /**
   * Se parchea la fila en vez de recargar la lista: recargar mostraría el
   * esqueleto de toda la tabla por un cambio de una celda. Sólo se pisa el
   * estado —los contadores no viajan en esas respuestas— y `respaldo` cubre el
   * 2xx sin cuerpo, donde el estado nuevo lo sabemos igual.
   */
  function aplicar(id: string, devuelto: EstadoAdminEstab | undefined, respaldo: EstadoAdminEstab) {
    setEstabs((prev) => prev.map((e) => (e.id === id ? { ...e, ...(devuelto ?? respaldo) } : e)));
  }

  async function confirmarSuspension(estab: AdminEstab, motivo: string) {
    setErrorModal(null);
    const r = await suspender(estab.id, motivo);
    if (!r.ok) {
      setErrorModal(mensajeModerar(r.code, true));
      return;
    }
    aplicar(estab.id, r.estado, {
      estado: "suspendido",
      motivoEstado: motivo,
      // Sin respuesta no sabemos el sello: mejor no dibujarlo que inventarlo.
      fechaEstado: null,
      ejecutorEstado: "",
    });
    setASuspender(null);
    avisar(`Se suspendió ${estab.nombre}.`);
  }

  async function confirmarReactivacion(estab: AdminEstab) {
    setErrorModal(null);
    const r = await reactivar(estab.id);
    if (!r.ok) {
      setErrorModal(mensajeModerar(r.code, false));
      return;
    }
    aplicar(estab.id, r.estado, {
      estado: "activo",
      motivoEstado: "",
      fechaEstado: null,
      ejecutorEstado: "",
    });
    setAReactivar(null);
    avisar(`Se reactivó ${estab.nombre}.`);
  }

  function cerrarModal() {
    setASuspender(null);
    setAReactivar(null);
    setErrorModal(null);
  }

  return (
    <div className="mx-auto max-w-[1240px] px-7 pt-7 pb-[72px]">
      <PageHead />
      <Stats
        activos={activos}
        suspendidos={suspendidos}
        total={estabs.length}
        hayAlerta={suspendidos > 0}
      />
      <Filtros query={query} onQuery={setQuery} filtro={filtro} onFiltro={setFiltro} />

      <Card className="overflow-hidden p-0">
        {visibles.length === 0 ? (
          <div className="px-6 py-14 text-center text-fg-3">
            <SearchX className="mx-auto size-8" />
            <div className="mt-3 text-[15px]">
              {estabs.length === 0
                ? "Todavía no hay establecimientos en la plataforma."
                : "No hay establecimientos que coincidan con la búsqueda."}
            </div>
          </div>
        ) : (
          <Tabla>
            <tbody>
              {visibles.map((e) => {
                const susp = e.estado === "suspendido";
                const sello = susp ? selloDe(e) : "";
                return (
                  <Fragment key={e.id}>
                    <tr
                      className={cn(
                        susp ? "bg-danger-fill" : "border-b border-cream-tert",
                      )}
                    >
                      <td className="p-4 align-middle">
                        <div className="flex items-center gap-3.5">
                          <span
                            className={cn(
                              "inline-flex size-[46px] shrink-0 items-center justify-center rounded-[10px] border font-display text-[15px] font-bold",
                              susp
                                ? "border-outline-variant bg-cream-tert text-fg-3"
                                : "border-green-300 bg-green-050 text-green-800",
                            )}
                          >
                            {estabInitials(e.nombre || "?")}
                          </span>
                          <div className="min-w-0">
                            <div className="truncate font-display text-base leading-tight font-semibold text-fg-1">
                              {e.nombre || "Sin nombre"}
                            </div>
                            <div className="mt-[3px] flex items-center gap-1.5 text-[12.5px] text-fg-2">
                              <User className="size-[13px] shrink-0 text-fg-3" />
                              <span className="truncate">{e.productorLider || "—"}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 align-middle">
                        <span className="inline-flex items-center gap-1.5 text-[13.5px] text-fg-1">
                          <MapPin className="size-[14px] shrink-0 text-brown-700" />
                          <span className="truncate">{e.departamento + ", Mendoza" || "—"}</span>
                        </span>
                      </td>
                      <td className="p-4 text-center align-middle">
                        <ContadoresActividad estab={e} />
                      </td>
                      <td className="p-4 align-middle font-mono text-[13px] text-fg-2">
                        {fmtFecha(e.fechaAlta)}
                      </td>
                      <td className="p-4 align-middle">
                        <EstadoBadge tone={susp ? "danger" : "success"}>
                          {susp ? "Suspendido" : "Activo"}
                        </EstadoBadge>
                      </td>
                      <td className="p-4 align-middle">
                        <div className="flex justify-end">
                          {susp ? (
                            <ActionBtn
                              icon={<RotateCcw className="size-[17px]" />}
                              label="Reactivar"
                              disabled={!gestionar}
                              title={gestionar ? "Reactivar este establecimiento" : SIN_GESTION}
                              onClick={() => setAReactivar(e)}
                            />
                          ) : (
                            <ActionBtn
                              icon={<Ban className="size-[17px]" />}
                              label="Suspender"
                              tone="danger"
                              disabled={!gestionar}
                              title={gestionar ? "Suspender este establecimiento" : SIN_GESTION}
                              onClick={() => setASuspender(e)}
                            />
                          )}
                        </div>
                      </td>
                    </tr>
                    {susp && (
                      <tr className="border-b border-cream-tert bg-danger-fill">
                        <td colSpan={6} className="px-4 pt-0 pb-4 pl-[74px]">
                          <div className="flex items-start gap-2.5 rounded-md border border-danger bg-surface px-3.5 py-2.5">
                            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-danger" />
                            <div className="min-w-0">
                              <div className="t-label mb-1 text-danger-fg">
                                Motivo de la suspensión
                              </div>
                              <div className="text-[13.5px] leading-relaxed text-fg-1">
                                {e.motivoEstado || "Sin motivo registrado."}
                              </div>
                              {sello && (
                                <div className="mt-1.5 flex items-center gap-1.5 text-[11.5px] text-fg-3">
                                  <Clock className="size-3 shrink-0" /> {sello}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </Tabla>
        )}
      </Card>

      {aSuspender && (
        <SuspenderModal
          estab={aSuspender}
          busy={isLoading}
          error={errorModal}
          onCancel={cerrarModal}
          onConfirm={(motivo) => confirmarSuspension(aSuspender, motivo)}
        />
      )}
      {aReactivar && (
        <ReactivarModal
          estab={aReactivar}
          busy={isLoading}
          error={errorModal}
          onCancel={cerrarModal}
          onConfirm={() => confirmarReactivacion(aReactivar)}
        />
      )}
      {toast && <Toast {...toast} />}
    </div>
  );
}

export default function EstablecimientosAdminClient() {
  const { establecimientos, isLoading, error, reload } = useEstablecimientosAdmin();
  const accesos = useAuthStore((s) => s.accesos);
  const gestionar = tienePermiso(accesos, PermisoAdmin.GESTIONAR_ESTABLECIMIENTO);

  return (
    <AsyncBoundary
      loading={isLoading}
      error={error}
      onRetry={reload}
      skeleton={<EstablecimientosSkeleton />}
    >
      {/* `reload` vuelve a poner `isLoading`, y con eso el boundary desmonta la
          pantalla: la copia local con las filas parcheadas se descarta sola y
          no queda mezclada con lo que acaba de llegar. */}
      <Pantalla initial={establecimientos} gestionar={gestionar} />
    </AsyncBoundary>
  );
}
