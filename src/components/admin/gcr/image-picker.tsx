"use client";

import { useRef, useState } from "react";
import {
  FolderOpen, Image as ImageIcon, Loader, Trash2, Upload, UploadCloud,
} from "lucide-react";
import { Button } from "@/components/ui";
import { cn, fmtBytes } from "@/lib/utils";
import type { useImagenUnica } from "@/hooks/useImagenUnica";
import type { LimitesImagen } from "@/types/imagen";
import { GcrErr } from "./shared";

/**
 * Selector de la imagen representativa: una sola, que se sube al bucket apenas
 * se elige. Es controlado —el estado vive en `useImagenUnica`— porque lo que el
 * formulario guarda es la key que ese hook devuelve, no el `File`.
 */
export function GcrImagePicker({
  imagen,
  limites,
}: {
  imagen: ReturnType<typeof useImagenUnica>;
  limites: LimitesImagen;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);

  const abrir = () => inputRef.current?.click();

  const tomar = async (lista: FileList | null) => {
    const file = lista?.[0];
    if (!file) return;
    await imagen.elegir(file);
    // Sin esto, volver a elegir el mismo archivo no dispara el change.
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept={limites.accept}
        className="hidden"
        onChange={(e) => tomar(e.target.files)}
      />

      {imagen.imagen ? (
        <div className="flex flex-wrap items-start gap-4">
          <div className="relative aspect-4/3 w-44 shrink-0 overflow-hidden rounded-lg border border-outline-variant bg-cream-tert">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imagen.imagen.previewUrl}
              alt={imagen.imagen.nombre}
              className="size-full object-cover"
            />
            {imagen.subiendo && (
              <span className="absolute inset-0 flex items-center justify-center bg-[rgba(42,38,32,0.45)]">
                <Loader className="spin size-5 text-white" />
              </span>
            )}
          </div>

          <div className="flex min-w-[200px] flex-1 flex-col gap-2.5">
            <div className="flex min-w-0 items-center gap-[7px] text-[13.5px] text-fg-2">
              <ImageIcon className="size-[15px] shrink-0 text-brown-700" />
              <span className="truncate">{imagen.imagen.nombre}</span>
              {imagen.imagen.bytes !== undefined && (
                <span className="shrink-0 font-mono text-xs text-fg-3">
                  {fmtBytes(imagen.imagen.bytes)}
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-2.5">
              <Button size="sm" onClick={abrir} disabled={imagen.subiendo}>
                <Upload className="size-4" /> Cambiar imagen
              </Button>
              <Button variant="neutral" size="sm" onClick={imagen.quitar} disabled={imagen.subiendo}>
                <Trash2 className="size-4" /> Quitar
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div
          onClick={imagen.subiendo ? undefined : abrir}
          onDragOver={(e) => {
            e.preventDefault();
            setDrag(true);
          }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDrag(false);
            if (!imagen.subiendo) tomar(e.dataTransfer.files);
          }}
          className={cn(
            "flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-[22px] py-[26px] text-center transition-colors",
            imagen.subiendo ? "cursor-default" : "cursor-pointer",
            imagen.error
              ? "border-danger bg-danger-fill"
              : drag
                ? "border-brown-500 bg-brown-200"
                : "border-brown-700 bg-brown-100 hover:bg-brown-200",
          )}
        >
          {imagen.subiendo ? (
            <>
              <Loader className="spin size-8 text-brown-700" />
              <div className="font-display text-[15px] font-semibold text-brown-800">
                Subiendo la imagen…
              </div>
            </>
          ) : (
            <>
              <UploadCloud className="size-8 text-brown-700" />
              <div className="font-display text-[15px] font-semibold text-brown-800">
                Arrastrá y soltá la imagen acá, o examiná tu equipo
              </div>
              <div className="mb-2 text-[12.5px] text-brown-800/85">
                {limites.formatosLabel} · hasta {fmtBytes(limites.maxBytes)} · se recorta a 4:3
              </div>
              {/* `pointer-events-none`: el clic lo maneja la zona, no la pastilla. */}
              <span className="pointer-events-none inline-flex items-center gap-2 rounded-md bg-brown-700 px-3 py-2 text-xs font-semibold text-fg-on-dark shadow-[var(--btn-tactile-secondary)]">
                <FolderOpen className="size-[15px]" /> Examinar archivos
              </span>
            </>
          )}
        </div>
      )}

      {imagen.error && (
        <div className="mt-2.5">
          <GcrErr msg={imagen.error} />
        </div>
      )}
    </div>
  );
}
