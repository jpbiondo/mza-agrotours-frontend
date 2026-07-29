"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Loader, ArrowLeft, Download, FileText, Image as ImageIcon, File as FileIcon,
  AlertTriangle, CalendarDays, PlusCircle, FileSearch, Clock, CheckCircle2,
} from "lucide-react";
import AsyncBoundary from "@/components/AsyncBoundary";
import { Card, EstadoBadge, SectionLabel } from "@/components/ui";
import { SOL_ESTADO_META } from "@/data/solicitudes";
import { fmtFechaHora } from "@/lib/format";
import { storageConfigurado, urlDeArchivo } from "@/lib/storage";
import { useSolicitudDetalle } from "@/hooks/useSolicitudDetalle";
import type { ArchivoSolicitud, EstadoSolicitud, SolicitudDetalle } from "@/types/solicitudes";

const NUEVA_HREF = "/mis-solicitudes/nueva";
const LISTA_HREF = "/mis-solicitudes";

/** Qué le decimos al usuario según en qué punto está la verificación. */
const RESUMEN_ESTADO: Record<EstadoSolicitud, { icon: typeof Clock; texto: string }> = {
  pendiente: {
    icon: Clock,
    texto:
      "Un administrador todavía está revisando tu documentación. Te avisamos por correo apenas haya una resolución.",
  },
  validada: {
    icon: CheckCircle2,
    texto:
      "Verificamos tu documentación y el establecimiento quedó dado de alta. Ya podés gestionarlo desde el panel de productor.",
  },
  rechazada: {
    icon: AlertTriangle,
    texto:
      "Revisamos tu documentación y no pudimos validar el establecimiento. Podés corregir lo observado y enviar una solicitud nueva.",
  },
};

/** Estilo del bloque de estado: mismo tono que el badge, en versión bloque. */
const ESTADO_BLOQUE: Record<EstadoSolicitud, { caja: string; texto: string }> = {
  pendiente: { caja: "border-warning bg-warning-fill", texto: "text-warning-fg" },
  validada: { caja: "border-success bg-success-fill", texto: "text-success-fg" },
  rechazada: { caja: "border-danger bg-danger-fill", texto: "text-danger-fg" },
};

function IconoArchivo({ extension }: { extension: string }) {
  const cls = "size-[17px] text-green-800";
  if (extension === "pdf") return <FileText className={cls} />;
  if (["png", "jpg", "jpeg"].includes(extension)) return <ImageIcon className={cls} />;
  return <FileIcon className={cls} />;
}

/** CVU enmascarado: sólo los últimos 4 dígitos. */
function cvuEnmascarado(cvu: string): string {
  if (!cvu) return "—";
  if (cvu.length <= 4) return cvu;
  return "•".repeat(cvu.length - 4) + cvu.slice(-4);
}

function Dato({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] font-bold tracking-[0.06em] text-brown-700 uppercase">
        {label}
      </dt>
      <dd
        className={`mt-1 break-words text-[14.5px] text-fg-1 ${mono ? "font-mono text-[13.5px]" : ""}`}
      >
        {value || "—"}
      </dd>
    </div>
  );
}

function ArchivoRow({ a }: { a: ArchivoSolicitud }) {
  const href = urlDeArchivo(a.key);

  return (
    <div className="flex items-center gap-3 rounded-md border border-outline-variant bg-surface px-3 py-2.5">
      <span className="inline-flex size-[34px] shrink-0 items-center justify-center rounded-lg bg-green-050">
        <IconoArchivo extension={a.extension} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13.5px] font-medium text-fg-1">
          {a.nombre || "Archivo sin nombre"}
        </span>
        {a.extension && (
          <span className="mt-px block font-mono text-[11.5px] text-fg-3 uppercase">
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
          className="btn btn-neutral btn-sm inline-flex shrink-0"
        >
          <Download className="size-[15px]" /> Descargar
        </a>
      ) : (
        <span className="shrink-0 text-[12.5px] text-fg-3">No disponible</span>
      )}
    </div>
  );
}

function Detalle({ s }: { s: SolicitudDetalle }) {
  const meta = SOL_ESTADO_META[s.estado] as
    | (typeof SOL_ESTADO_META)[keyof typeof SOL_ESTADO_META]
    | undefined;
  const resumen = RESUMEN_ESTADO[s.estado] as
    | (typeof RESUMEN_ESTADO)[EstadoSolicitud]
    | undefined;
  const ResumenIcon = resumen?.icon;
  const bloque = ESTADO_BLOQUE[s.estado] as
    | (typeof ESTADO_BLOQUE)[EstadoSolicitud]
    | undefined;
  const rechazada = s.estado === "rechazada";

  return (
    <>
      {/* Cabecera */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="font-display text-[30px] leading-tight font-bold tracking-[-.01em] text-fg-1">
            {s.nombreEstablecimiento || s.razonSocial || "Solicitud de establecimiento"}
          </h1>
          <p className="mt-2 flex items-center gap-1.5 text-[13.5px] text-fg-3">
            <CalendarDays className="size-[14px] shrink-0" />
            Enviada el {fmtFechaHora(s.fechaHoraAlta)}
          </p>
        </div>
        <EstadoBadge tone={meta?.tone ?? "neutral"} className="mt-1">
          {meta?.label ?? "Sin estado"}
        </EstadoBadge>
      </div>

      {/* Estado de la verificación. Si fue rechazada, la observación del admin es
          lo más importante de la pantalla, así que va acá arriba y destacada. */}
      {resumen && ResumenIcon && (
        <div className={`mb-6 rounded-lg border px-5 py-4 ${bloque?.caja ?? ""}`}>
          <div className="flex items-start gap-3">
            <ResumenIcon className={`mt-px size-[19px] shrink-0 ${bloque?.texto ?? ""}`} />
            <div className="min-w-0 flex-1">
              <p className={`text-[14px] leading-relaxed ${bloque?.texto ?? ""}`}>
                {resumen.texto}
              </p>
              {s.observacion && (
                <div className="mt-3 rounded-md border border-outline-variant bg-surface px-4 py-3">
                  <div className="text-[11px] font-bold tracking-[0.06em] text-brown-700 uppercase">
                    Devolución del administrador
                  </div>
                  <p className="mt-1.5 text-[14px] leading-relaxed whitespace-pre-line text-fg-2">
                    {s.observacion}
                  </p>
                </div>
              )}
              {rechazada && (
                <Link href={NUEVA_HREF} className="btn btn-primary btn-sm mt-3.5 inline-flex">
                  <PlusCircle className="size-[15px]" /> Enviar una nueva solicitud
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Datos enviados */}
      <Card className="px-[30px] pt-7 pb-[30px]">
        <SectionLabel>Datos del establecimiento</SectionLabel>
        <dl className="mt-3.5 mb-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Dato label="Nombre del establecimiento" value={s.nombreEstablecimiento} />
          <Dato label="Razón social" value={s.razonSocial} />
          <Dato label="CUIT" value={s.cuit} mono />
        </dl>

        <SectionLabel>Ubicación</SectionLabel>
        <dl className="mt-3.5 mb-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Dato label="Departamento" value={s.departamento} />
          <Dato label="Domicilio legal" value={s.domicilioLegal} />
        </dl>

        <SectionLabel>Contacto</SectionLabel>
        <dl className="mt-3.5 mb-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Dato label="Correo electrónico" value={s.email} />
          <Dato label="Teléfono" value={s.telefono} />
        </dl>

        <SectionLabel>Datos bancarios</SectionLabel>
        <dl className="mt-3.5 grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Dato label="CVU" value={cvuEnmascarado(s.cvu)} mono />
        </dl>

        <div className="my-[22px] h-px bg-cream-tert" />

        <SectionLabel>Documentación cargada</SectionLabel>
        {s.archivos.length === 0 ? (
          <p className="mt-2 text-[13.5px] text-fg-2">
            No hay archivos asociados a esta solicitud.
          </p>
        ) : (
          <>
            {!storageConfigurado && (
              <p className="mt-2 mb-3 text-[12.5px] text-fg-3">
                La descarga no está disponible: falta configurar la URL del almacenamiento.
              </p>
            )}
            <div className="mt-3 flex flex-col gap-2">
              {s.archivos.map((a, i) => (
                <ArchivoRow key={a.key || `${a.nombre}-${i}`} a={a} />
              ))}
            </div>
          </>
        )}
      </Card>
    </>
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
      <Link href={LISTA_HREF} className="btn btn-primary mt-2 inline-flex">
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
    <div className="mx-auto max-w-[820px] px-7 pt-7 pb-24">
      <Link
        href={LISTA_HREF}
        className="mb-5 inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-green-800"
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
