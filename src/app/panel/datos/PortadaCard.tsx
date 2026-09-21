"use client";

import { useRef, useState } from "react";
import {
  Crop, Image as ImageIcon, Loader, Trash2, Upload, UploadCloud, FolderOpen,
} from "lucide-react";
import { Button } from "@/components/ui";
import { ErrorMsg } from "@/components/panel/actividad/campos";
import { PORTADA_ACCEPT, PORTADA_ANCHO_MINIMO, PORTADA_MAX_BYTES } from "@/data/datos";
import { cn, fmtBytes } from "@/lib/utils";
import type { useFotoPortada } from "@/hooks/useFotoPortada";
import type { FotoPortada } from "@/types/datos";
import { SectionCard } from "./SectionCard";

/**
 * Portada del establecimiento. A diferencia del resto de las secciones no tiene
 * modo edición: se elige o se quita la imagen y se guarda en el acto, porque no
 * hay un formulario que completar alrededor.
 *
 * La imagen ya está en el bucket cuando se llama a `onGuardar`; lo que falta es
 * el PUT que la asocia al establecimiento.
 */
export function PortadaCard({
  foto,
  onGuardar,
  guardando,
}: {
  foto: ReturnType<typeof useFotoPortada>;
  /**
   * Persiste la portada. La tarjeta no sabe cómo; sólo que `null` es quitarla.
   * Se le pasa el valor nuevo en vez de dejar que lo lea del hook: cuando esto
   * corre, el estado de React todavía tiene el anterior.
   */
  onGuardar: (portada: FotoPortada | null) => void;
  guardando: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);

  const abrir = () => inputRef.current?.click();
  const ocupada = foto.subiendo || guardando;

  const tomar = async (lista: FileList | null) => {
    const file = lista?.[0];
    if (!file) return;
    const nueva = await foto.elegir(file);
    // Sin esto, volver a elegir el mismo archivo no dispara el change.
    if (inputRef.current) inputRef.current.value = "";
    // Si falló, el hook ya dejó el motivo a la vista: no hay nada que guardar.
    if (nueva) {
      onGuardar({ key: nueva.key, nombre: nueva.nombre, downloadUrl: nueva.previewUrl });
    }
  };

  const quitar = () => {
    foto.quitar();
    onGuardar(null);
  };

  return (
    <SectionCard
      title="Portada del establecimiento"
      icon={<ImageIcon className="size-4 text-green-800" />}
      locked
      isEditing={false}
      onEdit={() => {}}
      onCancel={() => {}}
      aside={
        foto.portada ? (
          <div className="flex shrink-0 gap-2">
            <Button variant="ghost" size="sm" className="text-sm" onClick={abrir} disabled={ocupada}>
              <Upload className="size-[15px]" /> Cambiar portada
            </Button>
            <Button variant="ghost" size="sm" className="text-sm" onClick={quitar} disabled={ocupada}>
              <Trash2 className="size-[15px]" /> Eliminar
            </Button>
          </div>
        ) : null
      }
    >
      <input
        ref={inputRef}
        type="file"
        accept={PORTADA_ACCEPT}
        className="hidden"
        onChange={(e) => tomar(e.target.files)}
      />

      <p className="mt-1.5 mb-4.5 max-w-[620px] text-sm leading-relaxed text-pretty text-fg-2">
        Es la primera foto que ven los visitantes en el perfil público de la finca. Elegí una imagen
        horizontal, con luz natural, que muestre el paisaje o el trabajo en el campo.
      </p>

      {foto.portada ? (
        <div>
          <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-outline-variant bg-cream-tert">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={foto.portada.previewUrl}
              alt={`Portada de la finca — ${foto.portada.nombre}`}
              className="size-full object-cover"
            />
            {/* Vela inferior: despega la imagen del fondo crema de la tarjeta. */}
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,rgba(251,249,248,.35),transparent_42%)]" />
            {foto.portada.ancho && (
              <div className="absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-pill bg-[rgba(20,33,18,0.6)] px-2.5 py-[5px] font-mono text-[11px] font-semibold text-white/95">
                <Crop className="size-3" />
                {foto.portada.ancho} × {foto.portada.alto} px
              </div>
            )}
            {ocupada && (
              <div className="absolute inset-0 flex items-center justify-center bg-[rgba(42,38,32,0.45)]">
                <Loader className="spin size-6 text-white" />
              </div>
            )}
          </div>
          <div className="mt-3 flex items-center gap-2 text-[13px]">
            <ImageIcon className="size-3.5 shrink-0 text-fg-3" />
            <span className="truncate font-medium text-fg-1">{foto.portada.nombre}</span>
            {foto.portada.bytes !== undefined && (
              <span className="shrink-0 font-mono text-xs text-fg-3">
                {fmtBytes(foto.portada.bytes)}
              </span>
            )}
          </div>
        </div>
      ) : (
        <div
          onClick={ocupada ? undefined : abrir}
          onDragOver={(e) => {
            e.preventDefault();
            setDrag(true);
          }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDrag(false);
            if (!ocupada) tomar(e.dataTransfer.files);
          }}
          className={cn(
            "flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-6 py-10 text-center transition-colors",
            ocupada ? "cursor-default" : "cursor-pointer",
            foto.error
              ? "border-danger bg-danger-fill"
              : drag
                ? "border-brown-500 bg-brown-200"
                : "border-brown-700 bg-brown-100 hover:bg-brown-200",
          )}
        >
          {foto.subiendo ? (
            <>
              <Loader className="spin size-9 text-brown-700" />
              <div className="font-display text-base font-semibold text-brown-800">
                Subiendo la portada…
              </div>
            </>
          ) : (
            <>
              <UploadCloud className="size-9 text-brown-700" />
              <div className="font-display text-base font-semibold text-brown-800">
                Arrastrá y soltá la portada acá, o examiná tu equipo
              </div>
              <div className="mb-2 text-[12.5px] text-brown-800/85">
                JPG o PNG · hasta {fmtBytes(PORTADA_MAX_BYTES)} · recomendado 1600 × 900 px (16:9)
              </div>
              {/* `pointer-events-none`: el clic lo maneja la zona, no la pastilla. */}
              <span className="pointer-events-none inline-flex items-center gap-2 rounded-md bg-brown-700 px-3 py-2 text-xs font-semibold text-fg-on-dark shadow-[var(--btn-tactile-secondary)]">
                <FolderOpen className="size-[15px]" /> Examinar archivos
              </span>
            </>
          )}
        </div>
      )}

      {foto.error && (
        <div className="mt-3">
          <ErrorMsg>{foto.error}</ErrorMsg>
        </div>
      )}

      {!foto.portada && !foto.error && (
        <p className="mt-2.5 text-xs text-fg-3">
          Mínimo {PORTADA_ANCHO_MINIMO} px de ancho.
        </p>
      )}
    </SectionCard>
  );
}
