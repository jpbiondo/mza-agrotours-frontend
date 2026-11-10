"use client";

import { useState } from "react";
import { BookOpen, ExternalLink, FileText, Upload } from "lucide-react";
import { AsyncView } from "@/components/AsyncView";
import { Button, Card, Skeleton, buttonClasses } from "@/components/ui";
import { EmptyState } from "@/components/ui/EmptyState";
import { Uploader } from "@/components/ui/uploader";
import { LIMITES_MANUAL, useManualUsuario, useSubirManual } from "@/hooks/useManualUsuario";
import { MENSAJE_FALLA, clasificarError } from "@/lib/errores";
import { notify } from "@/lib/notify";
import { cn } from "@/lib/utils";
import type { ManualUsuario, ResultadoManual } from "@/types/manual";

/** Por qué no se pudo reemplazar el manual. */
function mensajeError(r: ResultadoManual): string {
  if (r.code === "presign") return "No pudimos preparar la subida. Probá de nuevo en unos minutos.";
  if (r.code === "subida") return "No pudimos subir el archivo. Revisá tu conexión y probá de nuevo.";
  const falla = clasificarError(r.error);
  if (falla?.tipo === "permiso") return "Tu rol no incluye el permiso para modificar el manual.";
  return falla?.mensaje ?? MENSAJE_FALLA.servidor.mensaje;
}

function Vigente({ manual }: { manual: ManualUsuario }) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-md border border-outline-variant bg-surface px-3 py-2.5">
      <span className="inline-flex size-[34px] shrink-0 items-center justify-center rounded-lg bg-green-050">
        <FileText className="size-[17px] text-green-800" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[12.5px] text-fg-3">Manual vigente</span>
        <span className="block truncate text-[13.5px] font-medium text-fg-1">{manual.nombre}</span>
      </span>
      <a
        href={manual.url}
        target="_blank"
        rel="noopener noreferrer"
        className={buttonClasses({ variant: "text", size: "sm" })}
      >
        Ver <ExternalLink size={14} />
      </a>
    </div>
  );
}

/**
 * El manual de usuario que se descarga desde la ayuda: uno solo, para todos los
 * perfiles. Subir uno nuevo reemplaza al vigente apenas se confirma.
 */
export default function ManualUsuarioCard({ puedeGestionar }: { puedeGestionar: boolean }) {
  const lectura = useManualUsuario();
  const { subir, subiendo } = useSubirManual();
  const [files, setFiles] = useState<File[]>([]);

  // Al recargar después de reemplazarlo, se sigue viendo el anterior en vez del esqueleto.
  const recargando = lectura.isLoading && lectura.ultimo !== null;
  const query = recargando ? { ...lectura, isLoading: false, data: lectura.ultimo } : lectura;
  const hayManual = !!(lectura.data ?? lectura.ultimo);

  async function guardar() {
    const file = files[0];
    if (!file) return;
    const r = await subir(file);
    if (!r.ok) {
      notify.error("No se actualizó el manual", mensajeError(r));
      return;
    }
    setFiles([]);
    notify.success(hayManual ? "Manual reemplazado" : "Manual cargado");
    lectura.reload();
  }

  return (
    <Card className="mt-5 overflow-hidden">
      <div className="flex items-center gap-2.5 border-b border-outline-variant bg-cream-tert px-[22px] py-4">
        <BookOpen className="size-[17px] text-brown-700" />
        <h2 className="t-label">Manual de usuario</h2>
      </div>

      <div className="flex flex-col gap-5 px-[22px] py-5">
        <div aria-busy={recargando || undefined} className={cn(recargando && "opacity-60")}>
          <AsyncView
            query={query}
            skeleton={<Skeleton className="h-[58px] w-full rounded-md" />}
            // Sin manual el backend responde 404 y el hook lo lee como `null`.
            notFound={
              <EmptyState size="inline">
                Todavía no se cargó ningún manual. Mientras tanto, la sección no se muestra en la ayuda.
              </EmptyState>
            }
          >
            {(m) => <Vigente manual={m} />}
          </AsyncView>
        </div>

        {puedeGestionar && <Uploader files={files} onFiles={setFiles} limites={LIMITES_MANUAL} />}
        <div className="flex justify-end">
          <Button
            onClick={guardar}
            loading={subiendo}
            disabled={!puedeGestionar || files.length === 0}
            disabledReason={puedeGestionar ? undefined : "Tu rol no incluye el permiso para modificar el manual."}
          >
            <Upload className="size-[18px]" /> {hayManual ? "Reemplazar manual" : "Cargar manual"}
          </Button>
        </div>
      </div>
    </Card>
  );
}
