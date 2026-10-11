"use client";

import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertTriangle, ArrowDownWideNarrow, CalendarCheck, Check, CheckCircle2, ChevronRight, CircleDot,
  ClipboardCheck, Eye, FilterX, Inbox, Info, List as ListIcon, Loader, Lock, MessageSquareReply,
  RotateCcw, Settings2, UserRound, X, XCircle, type LucideIcon,
} from "lucide-react";
import AsyncBoundary from "@/components/AsyncBoundary";
import { Pagination } from "@/components/catalog/controls";
import { Alert, Button, Card, EstadoBadge, Skeleton, Toast } from "@/components/ui";
import { TextArea } from "@/components/ui/text-area";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { GcrFormShell } from "@/components/admin/gcr/shared";
import { admInitials } from "@/data/admin";
import { GI_ESTADOS, GI_ORDEN_ESTADOS, giCodigo, giEsTerminal } from "@/data/incidencias";
import {
  INCIDENCIAS_POR_PAGINA, pedirDetalleIncidencia, useGestionarIncidencia, useIncidencias,
} from "@/hooks/useIncidencias";
import { fmtFechaHora } from "@/lib/format";
import { PermisoAdmin } from "@/lib/permisos";
import { tienePermiso } from "@/lib/roles";
import { useAuthStore } from "@/stores/authStore";
import { cn } from "@/lib/utils";
import type { EstadoIncidencia, Incidencia, IncidenciaDetalle } from "@/types/incidencias";
import { MOTIVO_MAX, gestionSchema, type GestionForm } from "./schema";

const ICONO: Record<EstadoIncidencia, LucideIcon> = {
  reportada: CircleDot, revision: Loader, resuelta: CheckCircle2, desestimada: XCircle,
};

type Filtro = EstadoIncidencia | "todas";

function EstadoPill({ estado }: { estado: EstadoIncidencia | null }) {
  if (!estado) return <EstadoBadge>Sin estado</EstadoBadge>;
  const Icono = ICONO[estado];
  return (
    <EstadoBadge tone={GI_ESTADOS[estado].tone}>
      <Icono className="size-[13px]" /> {GI_ESTADOS[estado].label}
    </EstadoBadge>
  );
}

/** Mensaje para un rechazo del backend: con `code` es de dominio; sin él, técnico. */
function mensajeError(code: string | undefined): string {
  if (code === "entityNotFound") return "Esta incidencia ya no existe. Recargá el listado para ver los cambios.";
  if (code === "validacionNegocio")
    return "El cambio de estado no es válido. Puede que otra persona ya la haya actualizado: recargá el listado.";
  return "No pudimos guardar el cambio. Probá de nuevo en unos minutos.";
}

/* ---- Selector de estado (radios verticales) ----------------------------- */
function EstadoPicker({
  value, onChange, onBlur, ref, id, habilitados, "aria-invalid": ariaInvalid, "aria-describedby": describedBy,
}: {
  value: EstadoIncidencia;
  onChange: (v: EstadoIncidencia) => void;
  onBlur?: () => void;
  ref?: React.Ref<HTMLButtonElement>;
  id?: string;
  /** Estados elegibles. El resto se muestra deshabilitado. */
  habilitados: Set<EstadoIncidencia>;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Estado de la incidencia"
      aria-invalid={ariaInvalid}
      aria-describedby={describedBy}
      className="flex flex-col gap-2"
    >
      {GI_ORDEN_ESTADOS.map((e, i) => {
        const checked = value === e;
        const disabled = !habilitados.has(e);
        const Icono = ICONO[e];
        return (
          <button
            key={e}
            ref={i === 0 ? ref : undefined}
            id={i === 0 ? id : undefined}
            type="button"
            role="radio"
            aria-checked={checked}
            disabled={disabled}
            onClick={() => onChange(e)}
            onBlur={onBlur}
            className={cn(
              "flex w-full items-center gap-[13px] rounded-md border px-3.5 py-[11px] text-left transition-colors",
              checked ? "border-green-800 bg-green-050" : "border-outline-variant bg-surface",
              checked && !disabled && "shadow-[inset_0_-2px_0_var(--green-100)]",
              disabled ? "cursor-not-allowed" : "cursor-pointer hover:bg-cream-tert",
              disabled && !checked && "opacity-50",
            )}
          >
            <span
              className={cn(
                "flex size-5 shrink-0 items-center justify-center rounded-full border-2 bg-surface",
                checked ? "border-green-800" : "border-sand",
              )}
            >
              {checked && <span className="size-2.5 rounded-full bg-green-800" />}
            </span>
            <Icono className={cn("size-[17px]", checked ? "text-green-800" : "text-fg-3")} />
            <span className={cn("font-display text-[15px] font-semibold", checked ? "text-green-800" : "text-fg-1")}>
              {GI_ESTADOS[e].label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/* ---- Formulario del modal ----------------------------------------------- */
function GestionarForm({ detalle, puedeGestionar, busy, error, onCancel, onGuardar }: {
  detalle: IncidenciaDetalle & { estado: EstadoIncidencia };
  /** Sin GESTIONAR_INCIDENCIAS el modal es sólo de consulta. */
  puedeGestionar: boolean;
  busy: boolean;
  error: string | null;
  onCancel: () => void;
  onGuardar: (datos: GestionForm) => void;
}) {
  const cerrada = giEsTerminal(detalle.estado);
  const soloLectura = cerrada || !puedeGestionar;
  const form = useForm<GestionForm>({
    resolver: zodResolver(gestionSchema),
    // onChange y no onTouched: la obligatoriedad del motivo depende del estado
    // elegido, y el error tiene que irse en cuanto se corrige cualquiera de los dos.
    mode: "onChange",
    defaultValues: { estado: detalle.estado, motivo: "" },
  });
  const estado = useWatch({ control: form.control, name: "estado" });
  const motivo = useWatch({ control: form.control, name: "motivo" });
  const requiereMotivo = giEsTerminal(estado);
  const cambio = estado !== detalle.estado;
  // Se fija al elegir un estado de cierre, no en cada render: es una vista previa
  // de la fecha de fin, y el backend pone la real al guardar.
  const [cierre, setCierre] = useState<string | null>(null);

  // El actual queda elegible (para volver a él sin cambios) junto a los que habilita el backend.
  const habilitados = new Set<EstadoIncidencia>(soloLectura ? [] : [detalle.estado, ...detalle.estadosPosibles]);

  return (
    <Form {...form}>
      <form noValidate onSubmit={form.handleSubmit(onGuardar)} className="flex min-h-0 flex-1 flex-col">
        <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-[26px] py-[22px]">
          {/* Descripción completa — sólo lectura */}
          <div>
            <span className="mb-[9px] block font-display text-[14.5px] font-semibold text-fg-1">Descripción completa</span>
            <p className="rounded-md border border-sand bg-cream-tert px-3.5 py-3 text-[14.5px] leading-[1.55] whitespace-pre-wrap text-fg-1">
              {detalle.desc}
            </p>
            <p className="mt-[7px] flex items-center gap-1.5 text-xs text-fg-3">
              <Lock className="size-[13px]" /> El contenido reportado por el usuario no se puede modificar.
            </p>
          </div>

          {/* Fechas */}
          <div className="flex flex-wrap gap-3">
            {([["Fecha de inicio", detalle.fechaInicio], ["Fecha de fin", detalle.fechaFin]] as const).map(([label, v]) => (
              <div key={label} className="min-w-[180px] flex-1 rounded-md border border-outline-variant px-3.5 py-[11px]">
                <span className="t-label mb-[5px] block">{label}</span>
                <span className={cn("font-mono text-sm", v ? "text-fg-1" : "text-fg-3")}>{fmtFechaHora(v)}</span>
              </div>
            ))}
          </div>

          {/* Estado */}
          <FormField
            control={form.control}
            name="estado"
            render={({ field }) => (
              <FormItem className="gap-[9px]">
                <FormLabel className="font-display text-[14.5px] font-semibold">Estado de la incidencia</FormLabel>
                <FormControl>
                  <EstadoPicker
                    value={field.value}
                    onBlur={field.onBlur}
                    ref={field.ref}
                    habilitados={habilitados}
                    onChange={(v) => {
                      field.onChange(v);
                      if (giEsTerminal(v)) {
                        setCierre(new Date().toISOString());
                      } else {
                        form.setValue("motivo", "", { shouldValidate: true });
                      }
                    }}
                  />
                </FormControl>
                {cerrada ? (
                  <div className="mt-1 flex items-start gap-[9px] rounded-md border border-outline-variant bg-cream-tert px-[13px] py-2.5">
                    <Info className="mt-px size-4 shrink-0 text-fg-2" />
                    <span className="text-[13px] leading-normal text-fg-2">
                      Esta incidencia ya está <strong className="text-fg-1">{GI_ESTADOS[detalle.estado].label.toLowerCase()}</strong> y
                      quedó cerrada el {fmtFechaHora(detalle.fechaFin)}. El estado no se puede volver a cambiar.
                    </span>
                  </div>
                ) : !puedeGestionar ? (
                  <div className="mt-1 flex items-start gap-[9px] rounded-md border border-outline-variant bg-cream-tert px-[13px] py-2.5">
                    <Lock className="mt-px size-4 shrink-0 text-fg-2" />
                    <span className="text-[13px] leading-normal text-fg-2">
                      Tu rol puede consultar las incidencias, pero no cambiar su estado.
                    </span>
                  </div>
                ) : requiereMotivo ? (
                  <div className="mt-1 flex items-start gap-[9px] rounded-md border border-green-300 bg-green-050 px-[13px] py-2.5">
                    <CalendarCheck className="mt-px size-4 shrink-0 text-green-800" />
                    <span className="text-[13px] leading-normal text-green-800">
                      Al guardar, la incidencia quedará cerrada con fecha de fin <strong>{fmtFechaHora(cierre)}</strong> y
                      su estado no podrá cambiarse nuevamente.
                    </span>
                  </div>
                ) : null}
              </FormItem>
            )}
          />

          {/* Motivo de cierre — de sólo lectura en una cerrada */}
          {cerrada && detalle.motivo && (
            <div className="rounded-md border border-outline-variant bg-cream-tert px-3.5 py-3">
              <div className="mb-1.5 flex items-center gap-[7px] text-fg-3">
                <MessageSquareReply className="size-3.5" />
                <span className="t-label text-[11px] text-current">Motivo del cierre</span>
              </div>
              <p className="text-[14px] leading-[1.55] whitespace-pre-wrap text-fg-1">{detalle.motivo}</p>
            </div>
          )}

          {/* Motivo — obligatorio al cerrar */}
          {!soloLectura && (
            <FormField
              control={form.control}
              name="motivo"
              render={({ field }) => (
                <FormItem className="gap-[9px]">
                  <FormLabel required={requiereMotivo} className="font-display text-[14.5px] font-semibold">
                    Motivo
                  </FormLabel>
                  <FormControl>
                    <TextArea
                      {...field}
                      rows={4}
                      maxLength={MOTIVO_MAX}
                      disabled={!requiereMotivo}
                      placeholder={
                        requiereMotivo
                          ? "Detallá por qué se resolvió o desestimó la incidencia…"
                          : "Seleccioná «Resuelta» o «Desestimada» para cargar el motivo."
                      }
                      className="min-h-24 disabled:bg-cream-tert"
                    />
                  </FormControl>
                  <div className="flex items-center justify-between gap-3">
                    {form.formState.errors.motivo ? (
                      <FormMessage />
                    ) : (
                      <span className="flex items-center gap-1.5 text-xs text-fg-3">
                        <Info className="size-[13px]" />
                        {requiereMotivo
                          ? "Campo obligatorio. Quedará registrado junto al cierre y lo verá quien la reportó."
                          : "Se habilita al pasar a un estado de cierre."}
                      </span>
                    )}
                    <span
                      className={cn(
                        "shrink-0 font-mono text-[11.5px]",
                        motivo.length >= MOTIVO_MAX ? "text-danger" : "text-fg-3",
                      )}
                    >
                      {motivo.length}/{MOTIVO_MAX}
                    </span>
                  </div>
                </FormItem>
              )}
            />
          )}

          {error && <Alert>{error}</Alert>}
        </div>

        <div className="flex shrink-0 justify-end gap-3 border-t border-outline-variant bg-cream-tert px-[26px] py-4">
          <Button variant="neutral" onClick={onCancel} disabled={busy}>
            <X className="size-[17px]" /> {puedeGestionar ? "Cancelar" : "Cerrar"}
          </Button>
          {puedeGestionar && (
            <Button type="submit" disabled={cerrada || !cambio || busy}>
              {busy ? <Loader className="spin size-[17px]" /> : <Check className="size-[17px]" />} Guardar
            </Button>
          )}
        </div>
      </form>
    </Form>
  );
}

/* ---- Modal "Gestionar" --------------------------------------------------- */
function GestionarModal({ inc, puedeGestionar, busy, error, onCancel, onGuardar }: {
  inc: Incidencia;
  puedeGestionar: boolean;
  busy: boolean;
  error: string | null;
  onCancel: () => void;
  onGuardar: (datos: GestionForm) => void;
}) {
  // El listado trae la descripción recortada; la completa y las transiciones
  // válidas salen del detalle, que se pide al abrir.
  const [nonce, setNonce] = useState(0);
  const [detalle, setDetalle] = useState<{
    nonce: number;
    dato: IncidenciaDetalle | null;
    error: string | null;
  } | null>(null);
  const alDia = detalle?.nonce === nonce;

  useEffect(() => {
    let active = true;
    pedirDetalleIncidencia(inc.id).then((r) => {
      if (!active) return;
      setDetalle(
        r.ok
          ? { nonce, dato: r.detalle, error: null }
          : { nonce, dato: null, error: r.code === "entityNotFound" ? "Esta incidencia ya no existe." : "No pudimos cargar la incidencia." },
      );
    });
    return () => { active = false; };
  }, [inc.id, nonce]);

  const cerrar = busy ? () => {} : onCancel;
  const dato = alDia ? detalle.dato : null;

  return (
    <GcrFormShell onCancel={cerrar}>
      <div role="dialog" aria-modal="true" aria-label={`Gestionar incidencia ${inc.titulo}`} className="flex min-h-0 flex-1 flex-col">
        {/* Cabecera */}
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-outline-variant px-[26px] py-[22px]">
          <div className="min-w-0">
            <div className="mb-1.5 flex items-center gap-2.5">
              <span className="t-label">{puedeGestionar ? "Gestionar incidencia" : "Detalle de la incidencia"}</span>
              <span className="font-mono text-[11.5px] text-fg-3">{giCodigo(inc.id)}</span>
            </div>
            <h2 className="font-display text-[21px] leading-tight font-bold text-fg-1">{inc.titulo}</h2>
            <div className="mt-[9px] flex items-center gap-2 text-[13px] text-fg-2">
              <UserRound className="size-[15px] text-fg-3" />
              Reportada por <strong className="font-semibold text-fg-1">{inc.usuario || "—"}</strong>
            </div>
          </div>
          <button
            type="button"
            onClick={cerrar}
            aria-label="Cerrar"
            className="flex size-[42px] shrink-0 cursor-pointer items-center justify-center rounded-md border border-outline-variant bg-surface"
          >
            <X className="size-5 text-fg-2" />
          </button>
        </div>

        {!alDia ? (
          <div aria-busy="true" aria-label="Cargando incidencia…" className="flex flex-col gap-5 px-[26px] py-[22px]">
            <Skeleton className="h-28" />
            <div className="flex gap-3"><Skeleton className="h-16 flex-1" /><Skeleton className="h-16 flex-1" /></div>
            <div className="flex flex-col gap-2">
              {GI_ORDEN_ESTADOS.map((e) => <Skeleton key={e} className="h-11" />)}
            </div>
          </div>
        ) : !dato || !dato.estado ? (
          <div className="flex flex-col items-center px-[26px] py-12 text-center">
            <span className="mb-4 flex size-14 items-center justify-center rounded-full bg-danger-fill">
              <AlertTriangle className="size-[26px] text-danger-fg" />
            </span>
            <p className="mb-5 text-[15px] text-fg-2">{detalle.error ?? "La incidencia tiene un estado que no reconocemos."}</p>
            <Button variant="neutral" onClick={() => setNonce((n) => n + 1)}>
              <RotateCcw className="size-4" /> Reintentar
            </Button>
          </div>
        ) : (
          <GestionarForm
            detalle={{ ...dato, estado: dato.estado }}
            puedeGestionar={puedeGestionar}
            busy={busy}
            error={error}
            onCancel={cerrar}
            onGuardar={onGuardar}
          />
        )}
      </div>
    </GcrFormShell>
  );
}

/* ---- Tabla --------------------------------------------------------------- */
const COLS = ["Incidencia", "Denunciante", "Descripción", "Fecha inicio", "Fecha fin", "Estado", "Acción"];

function Tabla({ incidencias, puedeGestionar, onGestionar }: {
  incidencias: Incidencia[];
  puedeGestionar: boolean;
  onGestionar: (i: Incidencia) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1040px] border-collapse">
        <thead>
          <tr>
            {COLS.map((c, i) => (
              <th
                key={c}
                className={cn(
                  "border-b-2 border-outline-variant px-4 py-3.5 text-[12.5px] font-bold tracking-[.05em] whitespace-nowrap text-fg-2 uppercase",
                  i === COLS.length - 1 ? "text-right" : "text-left",
                )}
              >
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {incidencias.map((inc) => (
            <tr key={inc.id} className="border-b border-cream-tert even:bg-cream-tert">
              <td className="max-w-[320px] px-4 py-3.5">
                <span className="mb-[3px] block font-mono text-[11.5px] text-fg-3">{giCodigo(inc.id)}</span>
                <span className="block font-display text-[15px] leading-[1.3] font-semibold text-fg-1">{inc.titulo}</span>
              </td>
              <td className="px-4 py-3.5 whitespace-nowrap">
                <span className="inline-flex items-center gap-[9px]">
                  <span className="inline-flex size-[30px] shrink-0 items-center justify-center rounded-full bg-brown-700 font-display text-xs font-bold text-white">
                    {admInitials(inc.usuario)}
                  </span>
                  <span className="text-sm text-fg-1">{inc.usuario || "—"}</span>
                </span>
              </td>
              <td className="max-w-[220px] px-4 py-3.5">
                <span title={inc.descCorta} className="block truncate text-sm text-fg-2">{inc.descCorta}</span>
              </td>
              <td className="px-4 py-3.5 font-mono text-[13px] whitespace-nowrap text-fg-1">{fmtFechaHora(inc.fechaInicio)}</td>
              <td className={cn("px-4 py-3.5 font-mono text-[13px] whitespace-nowrap", inc.fechaFin ? "text-fg-1" : "text-fg-3")}>
                {fmtFechaHora(inc.fechaFin)}
              </td>
              <td className="px-4 py-3.5"><EstadoPill estado={inc.estado} /></td>
              <td className="px-4 py-3.5 text-right">
                <Button variant="neutral" size="sm" onClick={() => onGestionar(inc)}>
                  {puedeGestionar
                    ? <><Settings2 className="size-[15px]" /> Gestionar</>
                    : <><Eye className="size-[15px]" /> Ver</>}
                </Button>
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
    <div aria-busy="true" aria-label="Cargando incidencias…" className="flex flex-col gap-2 p-4">
      <Skeleton className="mb-2 h-6 w-72" />
      {Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-[58px]" />)}
    </div>
  );
}

/* ---- Página -------------------------------------------------------------- */
export default function IncidenciasClient() {
  const [filtro, setFiltro] = useState<Filtro>("todas");
  const [pagina, setPagina] = useState(1);
  const { incidencias, conteos, total, totalPaginas, isLoading, error, reload } = useIncidencias(filtro, pagina);
  const { guardar, guardando } = useGestionarIncidencia();
  // LEER_INCIDENCIAS ya lo exige el guard de la ruta; acá se distingue quién
  // además puede cambiar el estado.
  const accesos = useAuthStore((s) => s.accesos);
  const puedeGestionar = tienePermiso(accesos, PermisoAdmin.GESTIONAR_INCIDENCIAS);
  const [gestionando, setGestionando] = useState<Incidencia | null>(null);
  const [errorGuardar, setErrorGuardar] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4200);
    return () => clearTimeout(t);
  }, [toast]);

  function filtrar(f: Filtro) {
    setFiltro(f);
    setPagina(1);
  }

  function cerrarModal() {
    setGestionando(null);
    setErrorGuardar(null);
  }

  async function onGuardar({ estado, motivo }: GestionForm) {
    if (!gestionando) return;
    setErrorGuardar(null);
    const r = await guardar(gestionando.id, estado, giEsTerminal(estado) ? motivo : null);
    if (!r.ok) { setErrorGuardar(mensajeError(r.code)); return; }
    // Con un filtro de estado, la incidencia sale de la página: si era la única,
    // la página queda vacía y conviene ir a la anterior.
    if (filtro !== "todas" && incidencias.length === 1 && pagina > 1) setPagina((p) => p - 1);
    reload();
    setToast(`Incidencia ${giCodigo(gestionando.id)} actualizada a «${GI_ESTADOS[estado].label}».`);
    cerrarModal();
  }

  const tabs: { id: Filtro; label: string; Icono: LucideIcon; n: number }[] = [
    { id: "todas", label: "Todas", Icono: ListIcon, n: conteos.todas },
    ...GI_ORDEN_ESTADOS.map((e) => ({ id: e, label: GI_ESTADOS[e].label, Icono: ICONO[e], n: conteos.porEstado[e] })),
  ];
  const desde = (pagina - 1) * INCIDENCIAS_POR_PAGINA;

  return (
    <div className="mx-auto max-w-[1240px] px-7 pt-7 pb-[72px]">
      <div className="mb-3.5 flex items-center gap-2.5 text-[13.5px] text-fg-3">
        <span>Soporte</span>
        <ChevronRight className="size-[15px]" />
        <span className="font-medium text-fg-2">Gestionar incidencias</span>
      </div>

      <div className="mb-6 flex flex-wrap items-end justify-between gap-5">
        <div className="min-w-[280px]">
          <h1 className="font-display text-[32px] font-bold tracking-[-.01em] text-fg-1">Gestionar incidencias</h1>
          <p className="mt-2.5 max-w-[680px] text-[15.5px] leading-normal text-fg-2">
            Seguí las incidencias reportadas por los usuarios y actualizá su estado para asegurar que cada problema sea atendido y resuelto.
          </p>
        </div>
        <Card className="inline-flex items-center gap-[11px] rounded-md px-4 py-[11px]">
          <span className="flex size-[42px] shrink-0 items-center justify-center rounded-[10px] bg-green-050">
            <Inbox className="size-5 text-green-800" />
          </span>
          <span>
            <span className="block font-mono text-xl font-bold text-fg-1">{conteos.abiertas}</span>
            <span className="block text-[12.5px] text-fg-2">
              {conteos.abiertas === 1 ? "incidencia abierta" : "incidencias abiertas"}
            </span>
          </span>
        </Card>
      </div>

      {/* Filtro por estado */}
      <div role="tablist" aria-label="Filtrar por estado" className="mb-5 flex flex-wrap gap-2">
        {tabs.map(({ id, label, Icono, n }) => {
          const on = filtro === id;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => filtrar(id)}
              className={cn(
                "inline-flex cursor-pointer items-center gap-2 rounded-pill border px-[13px] py-2 text-[13.5px] font-semibold whitespace-nowrap transition-colors",
                on
                  ? "border-green-800 bg-green-800 text-white shadow-[inset_0_-2px_0_var(--green-900)]"
                  : "border-sand bg-surface text-fg-2 hover:bg-cream-tert",
              )}
            >
              <Icono className={cn("size-[15px]", on ? "text-white" : "text-fg-3")} />
              {label}
              <span
                className={cn(
                  "inline-flex h-[19px] min-w-5 items-center justify-center rounded-[10px] px-1.5 font-mono text-[11.5px] font-bold",
                  on ? "bg-white/20 text-white" : "bg-cream-tert text-fg-2",
                )}
              >
                {n}
              </span>
            </button>
          );
        })}
      </div>

      <Card className="overflow-hidden">
        <AsyncBoundary loading={isLoading} error={error} onRetry={reload} skeleton={<TablaEsqueleto />} pad={64}>
          {incidencias.length === 0 ? (
            <div className="flex flex-col items-center px-8 py-16 text-center">
              <span className="mb-[18px] flex size-16 items-center justify-center rounded-2xl bg-green-050">
                {filtro !== "todas"
                  ? <FilterX className="size-[30px] text-green-800" />
                  : <ClipboardCheck className="size-[30px] text-green-800" />}
              </span>
              <h2 className="mb-2 font-display text-xl font-bold text-fg-1">
                {filtro !== "todas" ? "No hay incidencias con ese estado" : "No hay incidencias reportadas"}
              </h2>
              <p className="max-w-[440px] text-[15px] text-fg-2">
                {filtro !== "todas"
                  ? "Probá con otro estado o seleccioná «Todas» para ver el listado completo."
                  : "Cuando los usuarios reporten un problema, vas a poder darle seguimiento desde acá."}
              </p>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-outline-variant px-4 py-[13px]">
                <span className="inline-flex items-center gap-2 text-[13.5px] text-fg-3">
                  <ArrowDownWideNarrow className="size-[15px]" /> Ordenadas por fecha de creación · más recientes primero
                </span>
                <span className="text-[13.5px] font-semibold text-fg-2">
                  {total} {total === 1 ? "incidencia" : "incidencias"}
                </span>
              </div>
              <Tabla incidencias={incidencias} puedeGestionar={puedeGestionar} onGestionar={(i) => { setErrorGuardar(null); setGestionando(i); }} />
            </>
          )}
        </AsyncBoundary>
      </Card>

      {!isLoading && !error && incidencias.length > 0 && (
        <div className="mt-[18px] flex flex-wrap items-center justify-between gap-4">
          <span className="text-[13px] text-fg-3">
            Mostrando {desde + 1}–{desde + incidencias.length} de {total}
          </span>
          <Pagination page={pagina} pages={totalPaginas} onPage={setPagina} />
        </div>
      )}

      {gestionando && (
        <GestionarModal
          inc={gestionando}
          puedeGestionar={puedeGestionar}
          busy={guardando}
          error={errorGuardar}
          onCancel={cerrarModal}
          onGuardar={onGuardar}
        />
      )}
      {toast && <Toast tone="success" title={toast} />}
    </div>
  );
}
