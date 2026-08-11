"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ChevronRight, Clock, CheckCircle2, XCircle, Search, Inbox, User, MapPin,
  ArrowLeft, Hash, Building2, Mail, Phone, Map, Paperclip, Info, ShieldCheck,
  MessageSquare, AlertCircle, Loader, ClipboardCheck, Eye, FileText,
  Image as ImageIcon, ExternalLink, Landmark, BadgeCheck,
} from "lucide-react";
import AsyncBoundary from "@/components/AsyncBoundary";
import AdminShell from "@/components/admin/AdminShell";
import { Button, Card, EstadoBadge } from "@/components/ui";
import { TextField } from "@/components/ui/text-field";
import { SOL_ESTADO_META } from "@/data/solicitudes";
import { admInitials } from "@/data/admin";
import { fmtFecha, fmtFechaHora } from "@/lib/format";
import { puede } from "@/lib/roles";
import { storageConfigurado, urlDeArchivo } from "@/lib/storage";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/authStore";
import { BASE_ADMIN_SOLICITUDES, useSolicitudDetalle } from "@/hooks/useSolicitudDetalle";
import { useResolverSolicitud, useSolicitudes, type Resolucion } from "@/hooks/useSolicitudes";
import type {
  EstadoSolicitud, PruebaSolicitud, SolicitudAdminItem, SolicitudDetalle,
} from "@/types/solicitudes";

const OBS_MAX = 1000;
const SIN_GESTION = "Necesitás el permiso de gestión de solicitudes de establecimiento";

function metaDe(estado: EstadoSolicitud) {
  return SOL_ESTADO_META[estado] as
    | (typeof SOL_ESTADO_META)[keyof typeof SOL_ESTADO_META]
    | undefined;
}

function Estado({ estado, size }: { estado: EstadoSolicitud; size?: "sm" | "lg" }) {
  const m = metaDe(estado);
  return (
    <EstadoBadge tone={m?.tone ?? "neutral"} size={size}>
      {m?.label ?? "Sin estado"}
    </EstadoBadge>
  );
}

/** Tile con las iniciales del establecimiento. */
function EstabTile({ nombre, size = "sm" }: { nombre: string; size?: "sm" | "lg" }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center border border-green-300 bg-green-050 font-display font-bold text-green-800",
        size === "lg" ? "size-14 rounded-xl text-[19px]" : "size-11 rounded-[10px] text-[15px]",
      )}
    >
      {admInitials(nombre || "?")}
    </span>
  );
}

/* =========================== LISTADO =========================== */

type Filtro = "todas" | EstadoSolicitud;

function List({
  solicitudes,
  onOpen,
}: {
  solicitudes: SolicitudAdminItem[];
  onOpen: (id: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filtro>("pendiente");

  const counts = useMemo(
    () => ({
      pendiente: solicitudes.filter((s) => s.estado === "pendiente").length,
      validada: solicitudes.filter((s) => s.estado === "validada").length,
      rechazada: solicitudes.filter((s) => s.estado === "rechazada").length,
    }),
    [solicitudes],
  );

  const visibles = useMemo(() => {
    const q = query.trim().toLowerCase();
    return solicitudes.filter((s) => {
      if (filter !== "todas" && s.estado !== filter) return false;
      if (
        q &&
        !(
          s.nombreEstablecimiento.toLowerCase().includes(q) ||
          s.nombreSolicitante.toLowerCase().includes(q) ||
          s.departamento.toLowerCase().includes(q)
        )
      )
        return false;
      return true;
    });
  }, [solicitudes, query, filter]);

  const stats = [
    { icon: Clock, label: "Pendientes", value: counts.pendiente, warn: counts.pendiente > 0 },
    { icon: CheckCircle2, label: "Validadas", value: counts.validada, warn: false },
    { icon: XCircle, label: "Rechazadas", value: counts.rechazada, warn: false },
  ];

  const filterBtn = (val: Filtro, label: string, n?: number) => {
    const on = filter === val;
    return (
      <button
        key={val}
        type="button"
        onClick={() => setFilter(val)}
        className={cn(
          "inline-flex cursor-pointer items-center gap-[7px] rounded-pill border px-[15px] py-2.5 text-[13.5px] font-semibold whitespace-nowrap transition-colors",
          on
            ? "border-green-800 bg-green-800 text-fg-on-dark"
            : "border-outline-variant bg-surface text-fg-2 hover:bg-cream-tert",
        )}
      >
        {label}
        {n != null && (
          <span
            className={cn(
              "rounded-full px-[7px] py-px font-mono text-xs font-bold",
              on ? "bg-white/20 text-fg-on-dark" : "bg-cream-tert text-fg-2",
            )}
          >
            {n}
          </span>
        )}
      </button>
    );
  };

  return (
    <div className="mx-auto max-w-[1180px] px-7 pt-7 pb-20">
      <div className="mb-3.5 flex items-center gap-2.5 text-[13.5px] text-fg-3">
        <span>Plataforma</span>
        <ChevronRight className="size-[15px]" />
        <span className="font-medium text-fg-2">Solicitudes de establecimientos</span>
      </div>

      <div className="mb-[22px]">
        <h1 className="font-display text-[32px] font-bold tracking-[-.01em] text-fg-1">
          Solicitudes de establecimientos
        </h1>
        <p className="mt-2.5 max-w-[720px] text-[15.5px] leading-relaxed text-fg-2">
          Revisá las postulaciones de nuevos establecimientos y validá su veracidad. Aprobá las
          que cumplan los requisitos o rechazalas dejando una observación.
        </p>
      </div>

      <div className="mb-5 flex flex-wrap gap-3.5">
        {stats.map((s) => (
          <Card key={s.label} className="flex min-w-[180px] items-center gap-3 px-4 py-3">
            <span
              className={cn(
                "flex size-[42px] shrink-0 items-center justify-center rounded-[10px]",
                s.warn ? "bg-warning-fill" : "bg-green-050",
              )}
            >
              <s.icon className={cn("size-5", s.warn ? "text-warning-fg" : "text-green-800")} />
            </span>
            <span>
              <span className="block font-mono text-xl font-bold text-fg-1">{s.value}</span>
              <span className="block text-[12.5px] text-fg-2">{s.label}</span>
            </span>
          </Card>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="min-w-[240px] flex-1">
          <TextField
            value={query}
            onChange={setQuery}
            icon={<Search />}
            placeholder="Buscar por establecimiento, solicitante o departamento"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {filterBtn("pendiente", "Pendientes", counts.pendiente)}
          {filterBtn("validada", "Validadas", counts.validada)}
          {filterBtn("rechazada", "Rechazadas", counts.rechazada)}
          {filterBtn("todas", "Todas")}
        </div>
      </div>

      <Card className="overflow-hidden p-0">
        {visibles.length === 0 ? (
          <div className="px-6 py-14 text-center text-fg-3">
            <Inbox className="mx-auto size-8" />
            <div className="mt-3 text-[15px]">
              {solicitudes.length === 0
                ? "Todavía no hay solicitudes de establecimientos."
                : "No hay solicitudes que coincidan con la búsqueda."}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[880px] border-collapse">
              <thead>
                <tr>
                  {["Establecimiento", "Departamento", "Solicitado", "Estado", ""].map((h, i) => (
                    <th
                      key={i}
                      className={cn(
                        "border-b-2 border-outline-variant px-[18px] py-3.5 text-[12.5px] font-bold tracking-[.05em] text-fg-2 uppercase whitespace-nowrap",
                        i === 4 ? "text-right" : "text-left",
                      )}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visibles.map((s) => (
                  <tr key={s.id} className="border-b border-cream-tert">
                    <td className="max-w-[360px] px-[18px] py-[15px]">
                      <div className="flex items-center gap-3">
                        <EstabTile nombre={s.nombreEstablecimiento} />
                        <div className="min-w-0">
                          <div className="font-display text-base leading-tight font-semibold text-fg-1">
                            {s.nombreEstablecimiento || "Sin nombre"}
                          </div>
                          <div className="mt-[3px] flex items-center gap-1.5 text-[12.5px] text-fg-2">
                            <User className="size-[13px] text-fg-3" />
                            {s.nombreSolicitante || "—"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-[18px] py-[15px]">
                      <span className="inline-flex items-center gap-1.5 text-[13.5px] text-fg-1">
                        <MapPin className="size-[14px] text-brown-700" />
                        {s.departamento || "—"}
                      </span>
                    </td>
                    <td className="px-[18px] py-[15px] font-mono text-[13px] text-fg-2">
                      {fmtFechaHora(s.fechaHoraAlta)}
                    </td>
                    <td className="px-[18px] py-[15px]">
                      <Estado estado={s.estado} />
                    </td>
                    <td className="px-[18px] py-[15px] text-right">
                      <Button
                        variant={s.estado === "pendiente" ? "primary" : "neutral"}
                        size="sm"
                        onClick={() => onOpen(s.id)}
                      >
                        {s.estado === "pendiente" ? (
                          <>
                            <ClipboardCheck className="size-4" /> Revisar
                          </>
                        ) : (
                          <>
                            <Eye className="size-4" /> Ver
                          </>
                        )}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

/* =========================== DETALLE =========================== */

function SectionBox({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="overflow-hidden">
      <header className="flex items-center gap-[11px] border-b border-cream-tert px-[22px] py-4">
        <div className="flex size-[30px] items-center justify-center rounded-lg bg-green-050">
          {icon}
        </div>
        <h2 className="font-display text-[17px] font-semibold text-fg-1">{title}</h2>
      </header>
      <div className="px-[22px] pt-2 pb-[22px]">{children}</div>
    </Card>
  );
}

function Etiqueta({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="mb-1.5 flex items-center gap-[7px] text-[11px] font-semibold tracking-[0.06em] text-fg-2 uppercase">
      {icon}
      {children}
    </div>
  );
}

function CritRow({
  icon,
  label,
  value,
  mono,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="border-b border-dashed border-cream-tert py-4">
      <Etiqueta icon={icon}>{label}</Etiqueta>
      <div
        className={cn(
          "font-medium break-words text-fg-1",
          mono ? "font-mono text-[15px]" : "text-[15px]",
        )}
      >
        {value || "—"}
      </div>
    </div>
  );
}

function DetailField({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div>
      <Etiqueta icon={icon}>{label}</Etiqueta>
      <div className="text-[14.5px] leading-relaxed break-words text-fg-1">{value || "—"}</div>
    </div>
  );
}

function PruebaCard({ p }: { p: PruebaSolicitud }) {
  const esPdf = p.extension === "pdf";
  const href = urlDeArchivo(p.key);

  const cuerpo = (
    <>
      <div
        className={cn(
          "relative flex h-[108px] items-center justify-center",
          esPdf
            ? "bg-green-050"
            : "bg-[repeating-linear-gradient(135deg,var(--cream-tert)_0_10px,var(--surface)_10px_20px)]",
        )}
      >
        {esPdf ? (
          <FileText className="size-[30px] text-green-800" />
        ) : (
          <ImageIcon className="size-[30px] text-brown-700" />
        )}
        {p.extension && (
          <span className="absolute top-2 right-2 rounded-full border border-outline-variant bg-cream-bg/90 px-[7px] py-0.5 font-mono text-[10.5px] font-bold tracking-[.04em] text-fg-2 uppercase">
            {p.extension}
          </span>
        )}
      </div>
      <div className="border-t border-cream-tert px-3 py-2.5">
        <div className="truncate text-[12.8px] font-semibold text-fg-1">
          {p.nombre || "Archivo sin nombre"}
        </div>
        <div className="mt-[3px] flex justify-end">
          {href ? (
            <span className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-green-800">
              <ExternalLink className="size-3" /> Ver
            </span>
          ) : (
            <span className="text-[11.5px] text-fg-3">No disponible</span>
          )}
        </div>
      </div>
    </>
  );

  const clases =
    "flex flex-col overflow-hidden rounded-md border border-outline-variant bg-surface no-underline";
  return href ? (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(clases, "transition-[box-shadow,border-color] hover:border-sand hover:shadow-[var(--shadow-hover)]")}
    >
      {cuerpo}
    </a>
  ) : (
    <div className={clases}>{cuerpo}</div>
  );
}

function Detail({
  sol,
  gestionar,
  busy,
  error,
  onBack,
  onResolver,
}: {
  sol: SolicitudDetalle;
  gestionar: boolean;
  busy: boolean;
  error: string | null;
  onBack: () => void;
  onResolver: (estado: Resolucion, obs: string) => void;
}) {
  const [obs, setObs] = useState("");
  const readOnly = sol.estado !== "pendiente";
  const obsErr = obs.length > OBS_MAX;
  const bloqueado = busy || obsErr || !gestionar;

  // Historial: el backend lo devuelve en `estados`; el más reciente lleva la
  // observación con la que se resolvió.
  const ultimo = sol.estados[0];

  return (
    <div className="mx-auto max-w-[1080px] px-7 pt-6 pb-24">
      <button
        type="button"
        onClick={onBack}
        className="mb-3.5 inline-flex cursor-pointer items-center gap-[7px] text-[13.5px] font-semibold text-green-800"
      >
        <ArrowLeft className="size-4" /> Volver a solicitudes
      </button>

      <div className="mb-6 flex min-w-0 items-center gap-4">
        <EstabTile nombre={sol.nombreEstablecimiento} size="lg" />
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-[28px] leading-tight font-bold tracking-[-.01em] text-fg-1">
            {sol.nombreEstablecimiento || "Solicitud de establecimiento"}
          </h1>
          <div className="mt-[11px] flex flex-wrap items-center gap-3.5 text-[13.5px] text-fg-2">
            <Estado estado={sol.estado} size="lg" />
            <span className="inline-flex items-center gap-1.5">
              <Hash className="size-[14px] text-fg-3" />
              <span className="font-mono">{sol.id}</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="size-[14px] text-fg-3" />
              Solicitado el {fmtFechaHora(sol.fechaHoraAlta)}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex min-w-0 flex-col gap-6">
          <SectionBox icon={<ShieldCheck className="size-4 text-green-800" />} title="Campos críticos">
            <CritRow icon={<Hash className="size-[13px] text-fg-3" />} label="CUIT" value={sol.cuit} mono />
            <CritRow icon={<Building2 className="size-[13px] text-fg-3" />} label="Razón social" value={sol.razonSocial} />
            <CritRow icon={<Mail className="size-[13px] text-fg-3" />} label="Email" value={sol.email} />
          </SectionBox>

          <SectionBox icon={<Info className="size-4 text-green-800" />} title="Datos del establecimiento">
            <div className="grid grid-cols-1 gap-[18px] pt-2 sm:grid-cols-2">
              <DetailField icon={<Phone className="size-[13px] text-fg-3" />} label="Teléfono de la organización" value={sol.telefono} />
              <DetailField icon={<MapPin className="size-[13px] text-fg-3" />} label="Domicilio legal" value={sol.domicilioLegal} />
              <DetailField icon={<Map className="size-[13px] text-fg-3" />} label="Departamento" value={sol.departamento} />
              <DetailField icon={<Landmark className="size-[13px] text-fg-3" />} label="CVU" value={sol.cvu} />
            </div>
          </SectionBox>

          <SectionBox
            icon={<Paperclip className="size-4 text-green-800" />}
            title={`Prueba de existencia y titularidad (${sol.pruebas.length})`}
          >
            <p className="mt-1.5 mb-3.5 text-[13px] text-fg-3">
              {storageConfigurado
                ? "Archivos cargados por el postulante (PNG, JPG o PDF)."
                : "No se pueden abrir: falta configurar la URL del almacenamiento."}
            </p>
            {sol.pruebas.length === 0 ? (
              <p className="text-sm text-fg-2">La solicitud no tiene pruebas cargadas.</p>
            ) : (
              <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-3.5">
                {sol.pruebas.map((p, i) => (
                  <PruebaCard key={p.key || i} p={p} />
                ))}
              </div>
            )}
          </SectionBox>
        </div>

        <aside className="flex flex-col gap-6">
          <SectionBox icon={<User className="size-4 text-green-800" />} title="Datos del solicitante">
            <div className="flex items-center gap-3 border-b border-dashed border-cream-tert pt-2 pb-3.5">
              <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-brown-700 text-[15px] font-semibold text-fg-on-dark">
                {admInitials(sol.nombreSolicitante || "?")}
              </span>
              <div className="min-w-0">
                <div className="text-[15px] font-semibold text-fg-1">
                  {sol.nombreSolicitante || "—"}
                </div>
                {sol.fechaHoraAltaSolicitante && (
                  <div className="mt-0.5 text-[12.5px] text-fg-3">
                    Miembro desde {fmtFecha(sol.fechaHoraAltaSolicitante)}
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-2.5 pt-3">
              <div className="flex items-center gap-2.5 text-[13.5px] text-fg-1">
                <BadgeCheck className="size-[15px] shrink-0 text-fg-3" />
                <span className="font-mono">{sol.identificacionSolicitante || "—"}</span>
              </div>
              <div className="flex items-center gap-2.5 text-[13.5px] break-all text-fg-1">
                <Mail className="size-[15px] shrink-0 text-fg-3" />
                {sol.emailSolicitante || "—"}
              </div>
            </div>
          </SectionBox>

          <SectionBox icon={<MessageSquare className="size-4 text-green-800" />} title="Observaciones">
            {readOnly ? (
              <div className="pt-2">
                <p
                  className={cn(
                    "text-sm leading-relaxed whitespace-pre-wrap",
                    ultimo?.observaciones ? "text-fg-1" : "text-fg-3",
                  )}
                >
                  {ultimo?.observaciones || "Sin observaciones."}
                </p>
                {ultimo?.fecha && (
                  <div className="mt-3 flex items-center gap-1.5 text-[12.5px] text-fg-3">
                    <Clock className="size-[13px]" />
                    {metaDe(sol.estado)?.label} el {fmtFechaHora(ultimo.fecha)}
                  </div>
                )}
              </div>
            ) : (
              <div className="pt-2">
                {/* Sin primitivo de textarea todavía: usa la clase del design system. */}
                <textarea
                  className={cn("textarea min-h-[120px] text-sm", obsErr && "err")}
                  value={obs}
                  onChange={(e) => setObs(e.target.value)}
                  rows={5}
                  disabled={!gestionar}
                  maxLength={OBS_MAX + 200}
                  placeholder="Observaciones sobre la solicitud. Se guardan junto con la decisión."
                />
                <div className="mt-[7px] flex items-center justify-between">
                  {obsErr ? (
                    <span className="err-msg text-[12.5px]">
                      <AlertCircle className="size-[14px] text-danger" />
                      Máximo {OBS_MAX} caracteres.
                    </span>
                  ) : (
                    <span className="text-xs text-fg-3">Hasta {OBS_MAX} caracteres.</span>
                  )}
                  <span className={cn("font-mono text-xs", obsErr ? "text-danger" : "text-fg-3")}>
                    {obs.length} / {OBS_MAX}
                  </span>
                </div>
              </div>
            )}
          </SectionBox>

          {!readOnly && (
            <Card className="sticky top-[84px] flex flex-col gap-2.5 p-[18px]">
              <Button
                variant="primary"
                size="lg"
                className="w-full"
                disabled={bloqueado}
                title={gestionar ? undefined : SIN_GESTION}
                onClick={() => onResolver("VALIDADA", obs.trim())}
              >
                {busy ? <Loader className="size-[18px] spin" /> : <CheckCircle2 className="size-[18px]" />}
                Aprobar solicitud
              </Button>

              {/* Rechazar es un danger "outline": no hay variante para eso en <Button>. */}
              <button
                type="button"
                disabled={bloqueado}
                title={gestionar ? undefined : SIN_GESTION}
                onClick={() => onResolver("RECHAZADA", obs.trim())}
                className={cn(
                  "inline-flex w-full items-center justify-center gap-2.5 rounded-md border bg-surface px-[18px] py-[13px] text-[15px] font-semibold transition-colors",
                  bloqueado
                    ? "cursor-not-allowed border-cream-tert text-fg-3"
                    : "cursor-pointer border-danger text-danger hover:bg-danger-fill",
                )}
              >
                <XCircle className="size-[18px]" /> Rechazar solicitud
              </button>

              {!gestionar && (
                <div className="mt-0.5 text-center text-xs leading-snug text-fg-3">
                  {SIN_GESTION}.
                </div>
              )}
              {error && (
                <span className="err-msg mt-0.5 text-[12.5px]">
                  <AlertCircle className="size-[14px] text-danger" />
                  {error}
                </span>
              )}
            </Card>
          )}
        </aside>
      </div>
    </div>
  );
}

/** Carga el detalle de la solicitud abierta y delega el render. */
function DetalleCargado({
  id,
  gestionar,
  onBack,
  onResuelta,
}: {
  id: string;
  gestionar: boolean;
  onBack: () => void;
  onResuelta: (estado: Resolucion) => void;
}) {
  const { solicitud, isLoading, error, notFound, reload } = useSolicitudDetalle(
    id,
    BASE_ADMIN_SOLICITUDES,
  );
  const { resolver, isLoading: resolviendo } = useResolverSolicitud();
  const [errorResolver, setErrorResolver] = useState<string | null>(null);

  async function onResolver(estado: Resolucion, obs: string) {
    setErrorResolver(null);
    const r = await resolver(id, estado, obs);
    if (r.ok) {
      onResuelta(estado);
      return;
    }
    setErrorResolver(
      r.code ?? "No pudimos procesar la solicitud. Intentá de nuevo en unos minutos.",
    );
  }

  return (
    <div className="mx-auto max-w-[1080px]">
      <AsyncBoundary
        loading={isLoading}
        error={error}
        onRetry={reload}
        loadingLabel="Cargando la solicitud…"
        pad={72}
      >
        {notFound || !solicitud ? (
          <div className="px-6 py-14 text-center text-fg-3">
            <Inbox className="mx-auto size-8" />
            <div className="mt-3 text-[15px]">No encontramos esta solicitud.</div>
            <Button variant="neutral" className="mt-4" onClick={onBack}>
              Volver a solicitudes
            </Button>
          </div>
        ) : (
          <Detail
            sol={solicitud}
            gestionar={gestionar}
            busy={resolviendo}
            error={errorResolver}
            onBack={onBack}
            onResolver={onResolver}
          />
        )}
      </AsyncBoundary>
    </div>
  );
}

function Inner() {
  const { solicitudes, isLoading, error, reload } = useSolicitudes();
  const accesos = useAuthStore((s) => s.accesos);
  const gestionar = puede(accesos, "GESTIONAR_SOLICITUD_ESTABLECIMIENTO");
  const [abierta, setAbierta] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [abierta]);

  function notify(msg: string) {
    setFlash(msg);
    setTimeout(() => setFlash((f) => (f === msg ? null : f)), 3800);
  }

  function onResuelta(estado: Resolucion) {
    setAbierta(null);
    // La lista trae el estado nuevo; se recarga en vez de parchearla a mano.
    reload();
    notify(
      estado === "VALIDADA"
        ? "Solicitud del establecimiento aprobada correctamente"
        : "Solicitud del establecimiento rechazada correctamente",
    );
  }

  return (
    <>
      {abierta ? (
        <DetalleCargado
          id={abierta}
          gestionar={gestionar}
          onBack={() => setAbierta(null)}
          onResuelta={onResuelta}
        />
      ) : (
        <AsyncBoundary
          loading={isLoading}
          error={error}
          onRetry={reload}
          loadingLabel="Cargando solicitudes…"
        >
          <List solicitudes={solicitudes} onOpen={setAbierta} />
        </AsyncBoundary>
      )}

      {flash && (
        <div className="pop fixed right-6 bottom-6 z-90 flex max-w-[400px] items-center gap-[11px] rounded-md bg-green-800 px-[18px] py-3.5 text-[14.5px] font-medium text-fg-on-dark shadow-[0px_8px_24px_rgba(45,90,39,0.18)]">
          <CheckCircle2 className="size-[19px]" /> {flash}
        </div>
      )}
    </>
  );
}

export default function SolicitudesClient() {
  return (
    <AdminShell active="solicitudes">
      <Inner />
    </AdminShell>
  );
}
