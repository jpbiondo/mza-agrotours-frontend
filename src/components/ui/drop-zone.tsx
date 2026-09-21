"use client";

import { useId, useRef, useState } from "react";
import { FolderOpen, UploadCloud } from "lucide-react";
import { cn } from "@/lib/utils";

interface DropZoneProps {
  /** Valor del atributo `accept` del input. Ej: ".pdf,.png,.jpg" */
  accept: string;
  onFiles: (files: File[]) => void;
  error?: boolean;
  titulo: string;
  ayuda: string;
  /**
   * Id del input oculto. Pasalo cuando algo fuera de la zona —un tile
   * "Agregar", por ejemplo— tenga que abrir el selector con un `<label>`.
   */
  inputId?: string;
  /**
   * Texto de la pastilla que hace de llamada a la acción ("Examinar
   * archivos"). Es decorativa: no es un botón ni recibe el clic, porque quien
   * lo maneja es la zona entera. Omitila y la zona queda sin pastilla.
   */
  accion?: string;
}

/**
 * Zona de arrastre y selector de archivos. Es sólo la caja punteada: quién la
 * usa decide cómo listar lo que se eligió (ver `FileUploader` e `ImageUploader`).
 */
export function DropZone({ accept, onFiles, error, titulo, ayuda, inputId, accion }: DropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const auto = useId();
  const id = inputId ?? auto;

  const pick = (list: FileList | null) => {
    if (!list) return;
    onFiles(Array.from(list));
    // Sin esto, volver a elegir el mismo archivo no dispara el change.
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => { e.preventDefault(); setDrag(false); pick(e.dataTransfer.files); }}
      className={cn(
        "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-8 text-center transition-colors",
        error
          ? "border-danger bg-danger-fill"
          : drag
          ? "border-brown-500 bg-brown-200"
          : "border-brown-700 bg-brown-100 hover:bg-brown-200",
      )}
    >
      <UploadCloud className="size-[34px] text-brown-700" />
      <div className="font-display text-[15.5px] font-semibold text-brown-800">{titulo}</div>
      <div className="text-[12.5px] text-brown-800/85">{ayuda}</div>
      {accion && (
        // `pointer-events-none`: el clic lo maneja la zona, no la pastilla.
        <span className="pointer-events-none mt-1.5 inline-flex items-center gap-2 rounded-md border border-transparent bg-brown-700 px-3 py-2 text-xs font-semibold text-fg-on-dark shadow-[var(--btn-tactile-secondary)]">
          <FolderOpen className="size-[15px]" />
          {accion}
        </span>
      )}
      <input
        ref={inputRef}
        id={id}
        type="file"
        multiple
        accept={accept}
        className="hidden"
        onChange={(e) => pick(e.target.files)}
      />
    </div>
  );
}
