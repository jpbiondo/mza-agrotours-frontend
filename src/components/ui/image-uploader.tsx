"use client";

import { useId, useState } from "react";
import {
  AlertCircle, AlertTriangle, ChevronLeft, ChevronRight, Image as ImageIcon, Loader, Move,
  Plus, RotateCw, Star, X, XCircle,
} from "lucide-react";
import { extensionDe } from "@/data/establecimiento";
import { cn, fmtBytes } from "@/lib/utils";
import type { FotoActividad } from "@/types/actividad-foto";
import { DropZone } from "./drop-zone";
import type { LimitesUploader } from "./uploader";

/**
 * Grilla de imágenes ordenable.
 *
 * A diferencia de `Uploader`, acá las fotos **ya se están subiendo**: el
 * componente no guarda `File`, sino el modelo que administra
 * `useFotosActividad`. Es controlado de punta a punta —no tiene estado propio
 * más allá del arrastre y el aviso de validación— porque el orden de la lista
 * es justamente lo que el formulario le manda al backend.
 *
 * El orden se cambia de dos maneras a propósito: arrastrando el tile, y con
 * las flechas de su pie. El arrastre solo no le sirve a quien navega con
 * teclado o no puede hacer un drag preciso.
 */

interface ImageUploaderProps {
  fotos: FotoActividad[];
  /** Los que pasaron la validación de formato, peso y cantidad. */
  onAgregar: (files: File[]) => void;
  onQuitar: (id: string) => void;
  onMover: (desde: number, hasta: number) => void;
  onReintentar: (id: string) => void;
  limites: LimitesUploader;
  /** Error que pone el formulario (p. ej. "cargá al menos una imagen"). */
  error?: string | null;
}

interface Aviso {
  tono: "danger" | "warning";
  texto: string;
}

function aceptada(file: File, limites: LimitesUploader): boolean {
  if (!limites.extensiones.includes(extensionDe(file.name))) return false;
  const mime = file.type.trim().toLowerCase();
  // El navegador puede no informar el tipo (drag & drop, SO sin el MIME
  // registrado): en ese caso alcanza con la extensión.
  return !limites.mimes || mime === "" || limites.mimes.includes(mime);
}

/** Miniatura. Cae en el ícono si la imagen no carga —una URL de descarga vencida, por ejemplo—. */
function Miniatura({ url, alt }: { url: string; alt: string }) {
  const [roto, setRoto] = useState(false);
  if (!url || roto) return <ImageIcon className="size-[26px] text-green-800" />;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt={alt} onError={() => setRoto(true)} className="size-full object-cover" />;
}

/** Botón chiquito del pie del tile, para mover la foto una posición. */
function BotonMover({
  hacia,
  disabled,
  onClick,
}: {
  hacia: "antes" | "despues";
  disabled: boolean;
  onClick: () => void;
}) {
  const Icono = hacia === "antes" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      title={hacia === "antes" ? "Mover antes" : "Mover después"}
      aria-label={hacia === "antes" ? "Mover antes" : "Mover después"}
      className={cn(
        "inline-flex size-5 items-center justify-center rounded-[5px] border border-outline-variant bg-surface",
        disabled ? "cursor-default opacity-30" : "cursor-pointer hover:bg-cream-tert",
      )}
    >
      <Icono className="size-[13px] text-fg-2" />
    </button>
  );
}

export function ImageUploader({
  fotos,
  onAgregar,
  onQuitar,
  onMover,
  onReintentar,
  limites,
  error,
}: ImageUploaderProps) {
  const [aviso, setAviso] = useState<Aviso | null>(null);
  const [arrastrando, setArrastrando] = useState<string | null>(null);
  const [encima, setEncima] = useState<string | null>(null);
  const inputId = useId();

  const { maxFiles, maxBytesPorArchivo, acceptLabel } = limites;

  const agregar = (entrantes: File[]) => {
    const validos: File[] = [];
    let problema: Aviso | null = null;

    for (const f of entrantes) {
      // El atributo `accept` no cubre el drag & drop: se revalida siempre.
      if (!aceptada(f, limites)) {
        problema = { tono: "danger", texto: `Formato no válido. Sólo se admiten imágenes ${acceptLabel}.` };
        continue;
      }
      if (maxBytesPorArchivo !== undefined && f.size > maxBytesPorArchivo) {
        problema = {
          tono: "danger",
          texto: `«${f.name}» excede el tamaño permitido. El peso máximo es de ${fmtBytes(maxBytesPorArchivo)} por imagen.`,
        };
        continue;
      }
      if (fotos.length + validos.length >= maxFiles) {
        problema = {
          tono: "warning",
          texto: `Se alcanzó el límite máximo de ${maxFiles} imágenes por actividad.`,
        };
        continue;
      }
      validos.push(f);
    }

    if (validos.length) onAgregar(validos);
    setAviso(problema);
  };

  const quitar = (id: string) => {
    onQuitar(id);
    setAviso(null);
  };

  const soltarEn = (destino: number) => {
    if (!arrastrando) return;
    const origen = fotos.findIndex((f) => f.id === arrastrando);
    if (origen !== -1) onMover(origen, destino);
    setArrastrando(null);
    setEncima(null);
  };

  const ayuda = [
    acceptLabel,
    maxBytesPorArchivo !== undefined ? `hasta ${fmtBytes(maxBytesPorArchivo)} c/u` : null,
    `máximo ${maxFiles} imágenes`,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div>
      <DropZone
        accept={limites.accept}
        onFiles={agregar}
        error={!!error}
        inputId={inputId}
        titulo="Arrastrá y soltá las imágenes aquí"
        ayuda={ayuda}
        accion="Examinar archivos"
      />

      {error && (
        <div className="mt-2 flex items-center gap-1.5 text-[12.5px] text-danger-fg">
          <AlertCircle className="size-3.5 shrink-0" /> {error}
        </div>
      )}

      {aviso && (
        <div
          className={cn(
            "mt-3 flex items-center gap-2 rounded-md px-3.5 py-2.5 text-[13px] font-medium",
            aviso.tono === "danger" ? "bg-danger-fill text-danger-fg" : "bg-warning-fill text-warning-fg",
          )}
        >
          {aviso.tono === "danger" ? (
            <XCircle className="size-4 shrink-0" />
          ) : (
            <AlertTriangle className="size-4 shrink-0" />
          )}
          <span>{aviso.texto}</span>
        </div>
      )}

      {fotos.length > 0 && (
        <>
          <div className="mt-4 flex items-center gap-[7px] text-[12.5px] text-fg-3">
            <Move className="size-3.5 shrink-0" />
            <span>
              Arrastrá las imágenes para ordenarlas. La primera se usa como portada de la actividad.
            </span>
          </div>

          <div className="mt-2.5 grid grid-cols-[repeat(auto-fill,minmax(108px,1fr))] gap-3">
            {fotos.map((f, i) => {
              const portada = i === 0;
              const destino = encima === f.id && arrastrando !== f.id;
              const subiendo = f.estado === "subiendo";
              const fallo = f.estado === "error";
              return (
                <div
                  key={f.id}
                  // Una foto a medio subir no se arrastra: su posición todavía
                  // no significa nada porque puede terminar en error.
                  draggable={!subiendo}
                  onDragStart={(e) => {
                    setArrastrando(f.id);
                    e.dataTransfer.effectAllowed = "move";
                    // Firefox no inicia el arrastre sin datos en el dataTransfer.
                    e.dataTransfer.setData("text/plain", f.id);
                  }}
                  onDragEnd={() => {
                    setArrastrando(null);
                    setEncima(null);
                  }}
                  onDragOver={(e) => {
                    if (!arrastrando) return;
                    // Sin `stopPropagation` el drop lo atiende también la
                    // DropZone de arriba y la reordenación se pierde.
                    e.preventDefault();
                    e.stopPropagation();
                    e.dataTransfer.dropEffect = "move";
                    setEncima(f.id);
                  }}
                  onDragLeave={() => setEncima((c) => (c === f.id ? null : c))}
                  onDrop={(e) => {
                    if (!arrastrando) return;
                    e.preventDefault();
                    e.stopPropagation();
                    soltarEn(i);
                  }}
                  className={cn(
                    "overflow-hidden rounded-md border bg-surface transition-[border-color,box-shadow]",
                    subiendo ? "cursor-default" : "cursor-grab",
                    arrastrando === f.id && "opacity-45",
                    destino
                      ? "border-green-800 shadow-[0_0_0_2px_var(--green-800)]"
                      : fallo
                        ? "border-danger"
                        : portada
                          ? "border-green-800"
                          : "border-outline-variant",
                  )}
                >
                  <div className="relative flex aspect-4/3 items-center justify-center bg-green-050">
                    <Miniatura url={f.previewUrl} alt={f.nombre} />

                    {portada && !subiendo && !fallo && (
                      <span className="absolute top-1.5 left-1.5 inline-flex items-center gap-1 rounded-pill bg-green-800 px-2 py-[3px] text-[10.5px] font-semibold tracking-[.01em] text-fg-on-dark">
                        <Star className="size-[11px]" /> Portada
                      </span>
                    )}

                    {subiendo && (
                      <span className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-[rgba(42,38,32,0.55)]">
                        <Loader className="spin size-5 text-white" />
                        <span className="text-[10.5px] font-semibold text-white">Subiendo…</span>
                      </span>
                    )}

                    {fallo && (
                      <span className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-danger-fill/92 px-1.5 text-center">
                        <AlertCircle className="size-[18px] text-danger" />
                        <span className="text-[10.5px] font-semibold text-danger-fg">No se subió</span>
                        <button
                          type="button"
                          onClick={() => onReintentar(f.id)}
                          className="inline-flex cursor-pointer items-center gap-1 rounded-[5px] border border-danger bg-surface px-1.5 py-1 text-[10.5px] font-semibold text-danger-fg hover:bg-cream-tert"
                        >
                          <RotateCw className="size-[11px]" /> Reintentar
                        </button>
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() => quitar(f.id)}
                      title="Eliminar imagen"
                      aria-label={`Eliminar ${f.nombre}`}
                      className="absolute top-1.5 right-1.5 inline-flex size-6 cursor-pointer items-center justify-center rounded-full bg-[rgba(42,38,32,0.72)] transition-colors hover:bg-[rgba(42,38,32,0.9)]"
                    >
                      <X className="size-3.5 text-white" />
                    </button>
                  </div>

                  <div className="truncate px-2 pt-[7px] text-[11.5px] font-medium text-fg-1" title={f.nombre}>
                    {f.nombre}
                  </div>
                  <div className="flex items-center justify-between gap-1 px-2 pt-px pb-1.5">
                    <span className="font-mono text-[10.5px] text-fg-3">
                      {f.file ? fmtBytes(f.file.size) : "Guardada"}
                    </span>
                    <span className="flex gap-0.5">
                      <BotonMover hacia="antes" disabled={i === 0} onClick={() => onMover(i, i - 1)} />
                      <BotonMover
                        hacia="despues"
                        disabled={i === fotos.length - 1}
                        onClick={() => onMover(i, i + 1)}
                      />
                    </span>
                  </div>
                </div>
              );
            })}

            {fotos.length < maxFiles && (
              <label
                htmlFor={inputId}
                className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-md border-[1.5px] border-dashed border-brown-700 bg-brown-100 text-[12px] font-semibold text-brown-700 transition-colors hover:bg-brown-200"
              >
                <Plus className="size-5" />
                Agregar
              </label>
            )}
          </div>
        </>
      )}

      <div className="mt-2 text-[12.5px] text-fg-3">
        {fotos.length} de {maxFiles} imágenes cargadas
      </div>
    </div>
  );
}
