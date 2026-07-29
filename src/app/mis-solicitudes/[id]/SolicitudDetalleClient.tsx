"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Loader, ArrowLeft, Download, FileText, Image as ImageIcon, File as FileIcon,
  CalendarDays, PlusCircle, FileSearch, Clock, CheckCircle2, XCircle, Send,
} from "lucide-react";
import AsyncBoundary from "@/components/AsyncBoundary";
import { EstadoBadge } from "@/components/ui";
import { SOL_ESTADO_META } from "@/data/solicitudes";
import { fmtFechaHora } from "@/lib/format";
import { storageConfigurado, urlDeArchivo } from "@/lib/storage";
import { cn } from "@/lib/utils";
import { useSolicitudDetalle } from "@/hooks/useSolicitudDetalle";
import type { ArchivoSolicitud, EstadoSolicitud, SolicitudDetalle } from "@/types/solicitudes";

const NUEVA_HREF = "/mis-solicitudes/nueva";
const LISTA_HREF = "/mis-solicitudes";

type Tono = "neutral" | "info" | "warning" | "success" | "danger";

/** Relleno del círculo de la línea de tiempo. El icono hereda por currentColor. */
const TONO_CIRCULO: Record<Tono, string> = {
  neutral: "bg-cream-tert text-fg-2",
  info: "bg-info-fill text-info-fg",
  warning: "bg-warning-fill text-warning-fg",
  success: "bg-success-fill text-success-fg",
  danger: "bg-danger-fill text-danger-fg",
};

/** Texto por defecto del hito cuando el backend no mandó observación. */
const MOTIVO_POR_ESTADO: Record<EstadoSolicitud, string> = {
  pendiente:
    "Un administrador va a verificar la documentación que cargaste. Te avisamos por correo apenas haya una resolución.",
  validada:
    "Verificamos la documentación y el establecimiento quedó dado de alta.",
  rechazada:
    "Revisamos la documentación y no pudimos validar el establecimiento.",
};

function iconoEstado(estado: EstadoSolicitud, cls: string): ReactNode {
  if (estado === "validada") return <CheckCircle2 className={cls} />;
  if (estado === "rechazada") return <XCircle className={cls} />;
  return <Clock className={cls} />;
}

function IconoArchivo({ extension }: { extension: string }) {
  const cls = "size-[17px] text-brown-700";
  if (extension === "pdf") return <FileText className={cls} />;
  if (["png", "jpg", "jpeg", "webp"].includes(extension)) return <ImageIcon className={cls} />;
  return <FileIcon className={cls} />;
}

/** CVU enmascarado: sólo los últimos 4 dígitos. */
function cvuEnmascarado(cvu: string): string {
  if (!cvu) return "—";
  if (cvu.length <= 4) return cvu;
  return "•".repeat(cvu.length - 4) + cvu.slice(-4);
}

function Seccion({
  title,
  cols = 2,
  children,
}: {
  title: string;
  cols?: 1 | 2;
  children: ReactNode;
}) {
  return (
    <div className="mt-7">
      <h2 className="mb-[18px] border-b border-outline-variant pb-2.5 font-display text-[15.5px] font-bold text-green-800">
        {title}
      </h2>
      <div
        className={cn(
          "grid gap-x-7 gap-y-5",
          cols === 1 ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2",
        )}
      >
        {children}
      </div>
    </div>
  );
}

function Dato({
  label,
  value,
  mono,
  span,
}: {
  label: string;
  value: string;
  mono?: boolean;
  span?: boolean;
}) {
  return (
    <div className={cn("min-w-0", span && "sm:col-span-2")}>
      <div className="mb-1.5 text-[11px] font-semibold tracking-[0.06em] text-fg-2 uppercase">
        {label}
      </div>
      <div
        className={cn(
          "leading-normal break-words text-fg-1",
          mono ? "font-mono text-[14px]" : "text-[15px]",
        )}
      >
        {value || "—"}
      </div>
    </div>
  );
}

function ArchivoRow({ a }: { a: ArchivoSolicitud }) {
  const href = urlDeArchivo(a.key);

  return (
    <div className="flex items-center gap-3 rounded-md border border-outline-variant bg-cream-tert px-3.5 py-3">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-[9px] border border-sand bg-surface">
        <IconoArchivo extension={a.extension} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[14px] font-medium text-fg-1">
          {a.nombre || "Archivo sin nombre"}
        </span>
        {a.extension && (
          <span className="mt-0.5 block font-mono text-[12px] text-fg-3 uppercase">
            {a.extension}
          </span>
        )}
      </span>
      {href ? (
        <a
          href={href}
          // `download` sólo lo respeta el navegador si el archivo es del mismo
          // origen; contra el storage abre en una pestaña, que sirve igual.
          download={a.nombre || undefined}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-neutral btn-sm shrink-0 no-underline"
        >
          <Download className="size-[15px]" /> Descargar
        </a>
      ) : (
        <span className="shrink-0 text-[12.5px] text-fg-3">No disponible</span>
      )}
    </div>
  );
}

interface Hito {
  label: string;
  tono: Tono;
  icono: ReactNode;
  fecha: string | null;
  motivo: string;
}

/**
 * Línea de tiempo del estado, del hito más reciente al más antiguo.
 *
 * El backend no devuelve un historial: sólo el estado actual, la observación y
 * la fecha de alta. Se arman los dos hitos que sí tienen respaldo — el envío y
 * la situación actual — sin inventar fechas ni autores para los que no hay dato.
 * TODO backend: un array de cambios de estado (fecha, autor, motivo) permitiría
 * mostrar el recorrido completo.
 */
function hitosDe(s: SolicitudDetalle): Hito[] {
  const meta = SOL_ESTADO_META[s.estado] as
    | (typeof SOL_ESTADO_META)[keyof typeof SOL_ESTADO_META]
    | undefined;

  return [
    {
      label: meta?.label ?? "Sin estado",
      tono: (meta?.tone as Tono) ?? "neutral",
      icono: iconoEstado(s.estado, "size-4"),
      fecha: null,
      motivo: s.observacion || MOTIVO_POR_ESTADO[s.estado] || "",
    },
    {
      label: "Enviada",
      tono: "info",
      icono: <Send className="size-4" />,
      fecha: fmtFechaHora(s.fechaHoraAlta),
      motivo: "Enviaste la solicitud de alta con la documentación de respaldo.",
    },
  ];
}

function Detalle({ s }: { s: SolicitudDetalle }) {
  const meta = SOL_ESTADO_META[s.estado] as
    | (typeof SOL_ESTADO_META)[keyof typeof SOL_ESTADO_META]
    | undefined;
  const hitos = hitosDe(s);

  return (
    <div className="rounded-lg border border-outline-variant bg-surface px-[30px] pt-7 pb-8">
      {/* Encabezado: título a la izquierda · estado actual arriba a la derecha */}
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div className="min-w-0">
          <h1 className="font-display text-[27px] leading-tight font-bold text-fg-1">
            {s.nombreEstablecimiento || s.razonSocial || "Solicitud de establecimiento"}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-3.5 text-[13.5px] text-fg-3">
            <span className="font-mono text-fg-2">{s.id}</span>
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="size-[14px]" /> Enviada el {fmtFechaHora(s.fechaHoraAlta)}
            </span>
          </div>
        </div>
        <EstadoBadge tone={meta?.tone ?? "neutral"} size="lg">
          {iconoEstado(s.estado, "size-4")}
          {meta?.label ?? "Sin estado"}
        </EstadoBadge>
      </div>

      <Seccion title="Datos del establecimiento">
        <Dato label="Nombre del establecimiento" value={s.nombreEstablecimiento} span />
        <Dato label="Razón social" value={s.razonSocial} />
        <Dato label="CUIT" value={s.cuit} mono />
      </Seccion>

      <Seccion title="Ubicación">
        <Dato label="Departamento" value={s.departamento} />
        <Dato label="Domicilio legal" value={s.domicilioLegal} />
      </Seccion>

      <Seccion title="Contacto">
        <Dato label="Correo electrónico" value={s.email} />
        <Dato label="Teléfono" value={s.telefono} />
      </Seccion>

      <Seccion title="Datos bancarios" cols={1}>
        <Dato label="CVU" value={cvuEnmascarado(s.cvu)} mono />
      </Seccion>

      <Seccion title="Archivos enviados" cols={1}>
        {s.archivos.length === 0 ? (
          <p className="text-[14px] text-fg-2">No hay archivos asociados a esta solicitud.</p>
        ) : (
          <div className="flex flex-col gap-2.5">
            {!storageConfigurado && (
              <p className="text-[12.5px] text-fg-3">
                La descarga no está disponible: falta configurar la URL del almacenamiento.
              </p>
            )}
            {s.archivos.map((a, i) => (
              <ArchivoRow key={a.key || `${a.nombre}-${i}`} a={a} />
            ))}
          </div>
        )}
      </Seccion>

      <Seccion title="Estado de la solicitud" cols={1}>
        <div className="flex flex-col">
          {hitos.map((h, i) => {
            const last = i === hitos.length - 1;
            return (
              <div key={i} className="flex gap-4">
                <div className="flex shrink-0 flex-col items-center">
                  <span
                    className={cn(
                      "flex size-[34px] items-center justify-center rounded-full",
                      TONO_CIRCULO[h.tono],
                    )}
                  >
                    {h.icono}
                  </span>
                  {!last && <span className="my-1 w-px flex-1 bg-outline-variant" />}
                </div>
                <div className={cn("min-w-0", last ? "pb-0" : "pb-6")}>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="text-[14.5px] font-semibold text-fg-1">{h.label}</span>
                    {h.fecha && <span className="text-[12.5px] text-fg-3">{h.fecha}</span>}
                  </div>
                  {h.motivo && (
                    <p className="mt-2 text-[14px] leading-relaxed text-fg-2">{h.motivo}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Seccion>

      {s.estado === "rechazada" && (
        <Link href={NUEVA_HREF} className="btn btn-primary mt-7 inline-flex no-underline">
          <PlusCircle className="size-[17px]" /> Enviar una nueva solicitud
        </Link>
      )}
    </div>
  );
}

function NoEncontrada() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-sand bg-surface px-6 py-16 text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-cream-tert">
        <FileSearch className="size-7 text-brown-700" />
      </div>
      <h2 className="font-display text-xl font-semibold text-fg-1">
        No encontramos esta solicitud
      </h2>
      <p className="max-w-[440px] text-[14.5px] leading-relaxed text-fg-2">
        Puede que el enlace esté mal o que la solicitud no sea tuya. Revisá el listado de tus
        solicitudes.
      </p>
      <Link href={LISTA_HREF} className="btn btn-primary mt-2 inline-flex no-underline">
        Ver mis solicitudes
      </Link>
    </div>
  );
}

export default function SolicitudDetalleClient({ id }: { id: string }) {
  const router = useRouter();
  const { solicitud, isLoading, error, notFound, unauthenticated, reload } =
    useSolicitudDetalle(id);

  // Ruta protegida: sin sesión, a la pantalla de login.
  useEffect(() => {
    if (unauthenticated) router.replace("/acceso");
  }, [unauthenticated, router]);

  if (unauthenticated) {
    return (
      <div className="px-7 py-[120px] text-center text-fg-3">
        <Loader size={26} className="spin" />
        <div className="mt-3 text-sm">Redirigiendo…</div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[900px] px-7 pt-7 pb-24">
      <Link
        href={LISTA_HREF}
        className="mb-3.5 inline-flex items-center gap-[7px] text-[13.5px] font-semibold text-green-800 no-underline"
      >
        <ArrowLeft className="size-4" /> Volver a mis solicitudes
      </Link>

      <AsyncBoundary
        loading={isLoading}
        error={error}
        onRetry={reload}
        loadingLabel="Cargando la solicitud…"
        pad={72}
      >
        {notFound || !solicitud ? <NoEncontrada /> : <Detalle s={solicitud} />}
      </AsyncBoundary>
    </div>
  );
}
