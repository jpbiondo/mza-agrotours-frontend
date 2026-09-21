"use client";

import { useId, useState } from "react";
import {
  AlertCircle, AlertTriangle, FileText, File as FileIcon, Image as ImageIcon, Trash2, XCircle,
} from "lucide-react";
import { extensionDe } from "@/data/establecimiento";
import { cn, fmtBytes } from "@/lib/utils";
import { DropZone } from "./drop-zone";

/**
 * Qué acepta un uploader. Se declara una vez por pantalla (ver `UPLOAD_PRUEBAS`
 * y `UPLOAD_FOTOS`) para que el componente valide siempre lo mismo que anuncia.
 */
export interface LimitesUploader {
  maxFiles: number;
  /** Tope por archivo. Omitilo cuando sólo importa la suma. */
  maxBytesPorArchivo?: number;
  /** Tope de la suma. Omitilo cuando sólo importa el individual. */
  maxBytesTotal?: number;
  /** Valor del atributo `accept` del input. */
  accept: string;
  /** Formatos, para los textos. Ej: "PDF, JPG o PNG". */
  acceptLabel: string;
  /** Extensiones aceptadas, en minúscula y sin punto: revalidan el drag & drop. */
  extensiones: readonly string[];
  /** MIMEs aceptados. Un `file.type` vacío no alcanza para rechazar. */
  mimes?: readonly string[];
}

interface UploaderProps {
  /** Los recién elegidos, que todavía no se subieron. */
  files: File[];
  onFiles: (files: File[]) => void;
  limites: LimitesUploader;
  /** Error que pone el formulario (p. ej. "cargá al menos un archivo"). */
  error?: string | null;
}

interface Aviso {
  tono: "danger" | "warning";
  texto: string;
}

const EXT_IMAGEN = ["png", "jpg", "jpeg", "webp", "gif", "heic"];

/** Ícono según la extensión. Devuelve el elemento y no el componente: armar uno
 *  durante el render lo remontaría en cada pasada. */
function IconoArchivo({ nombre, className }: { nombre: string; className: string }) {
  const ext = extensionDe(nombre);
  if (ext === "pdf") return <FileText className={className} />;
  if (EXT_IMAGEN.includes(ext)) return <ImageIcon className={className} />;
  return <FileIcon className={className} />;
}

function aceptado(file: File, limites: LimitesUploader): boolean {
  if (!limites.extensiones.includes(extensionDe(file.name))) return false;
  const mime = file.type.trim().toLowerCase();
  // El navegador puede no informar el tipo (drag & drop, SO sin el MIME
  // registrado): en ese caso alcanza con la extensión.
  return !limites.mimes || mime === "" || limites.mimes.includes(mime);
}

/** Fila de la vista en lista. */
function Fila({
  nombre,
  detalle,
  onQuitar,
}: {
  nombre: string;
  detalle: string;
  onQuitar: () => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-md border border-outline-variant bg-surface px-3 py-2.5">
      <span className="inline-flex size-[34px] shrink-0 items-center justify-center rounded-lg bg-green-050">
        <IconoArchivo nombre={nombre} className="size-[17px] text-green-800" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13.5px] font-medium text-fg-1">{nombre}</span>
        <span className="mt-px block font-mono text-[11.5px] text-fg-3">{detalle}</span>
      </span>
      <button
        type="button"
        aria-label={`Quitar ${nombre}`}
        onClick={onQuitar}
        className="inline-flex size-[30px] shrink-0 cursor-pointer items-center justify-center rounded-lg border border-outline-variant bg-surface hover:bg-cream-tert"
      >
        <Trash2 className="size-[15px] text-danger" />
      </button>
    </div>
  );
}

/**
 * Carga de archivos: zona de arrastre, validación y listado de lo elegido.
 *
 * Valida acá adentro —formato, peso por archivo, peso total y cantidad— para
 * que cada pantalla no rearme las mismas reglas; lo que sí queda del lado del
 * formulario es si el campo es obligatorio, que es una regla suya.
 *
 * Lista los archivos en filas con su peso. Para fotos —con miniatura, portada
 * y reordenamiento— está `ImageUploader`, que es otra cosa: ahí los archivos
 * se suben al soltarlos y el orden importa.
 */
export function Uploader({ files, onFiles, limites, error }: UploaderProps) {
  const [aviso, setAviso] = useState<Aviso | null>(null);
  const inputId = useId();

  const { maxFiles, maxBytesPorArchivo, maxBytesTotal, acceptLabel } = limites;
  const total = files.length;
  const bytes = files.reduce((s, f) => s + f.size, 0);
  const excedido = maxBytesTotal !== undefined && bytes > maxBytesTotal;

  const agregar = (entrantes: File[]) => {
    const suma: File[] = [];
    const rechazados: string[] = [];
    let limite: Aviso | null = null;

    for (const f of entrantes) {
      // El atributo `accept` no cubre el drag & drop: se revalida siempre.
      if (!aceptado(f, limites)) {
        rechazados.push(f.name);
        continue;
      }
      if (maxBytesPorArchivo !== undefined && f.size > maxBytesPorArchivo) {
        limite = {
          tono: "danger",
          texto: `«${f.name}» supera el peso máximo de ${fmtBytes(maxBytesPorArchivo)} por archivo.`,
        };
        continue;
      }
      if (total + suma.length >= maxFiles) {
        limite = { tono: "warning", texto: `Se alcanzó el límite de ${maxFiles} archivos.` };
        break;
      }
      if (
        maxBytesTotal !== undefined &&
        bytes + suma.reduce((s, x) => s + x.size, 0) + f.size > maxBytesTotal
      ) {
        limite = {
          tono: "danger",
          texto: `El conjunto no puede superar los ${fmtBytes(maxBytesTotal)}. Se omitieron algunos archivos.`,
        };
        continue;
      }
      suma.push(f);
    }

    if (suma.length) onFiles([...files, ...suma]);
    setAviso(
      rechazados.length
        ? { tono: "danger", texto: `Sólo se aceptan archivos ${acceptLabel}. Se rechazó: ${rechazados.join(", ")}.` }
        : limite,
    );
  };

  const quitarArchivo = (i: number) => {
    onFiles(files.filter((_, idx) => idx !== i));
    setAviso(null);
  };

  const ayuda = [
    acceptLabel,
    maxBytesPorArchivo !== undefined ? `hasta ${fmtBytes(maxBytesPorArchivo)} c/u` : null,
    maxBytesTotal !== undefined ? `máximo ${fmtBytes(maxBytesTotal)} en total` : null,
    `máximo ${maxFiles} archivos`,
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
        titulo="Arrastrá y soltá los archivos aquí, o examiná tu equipo"
        ayuda={ayuda}
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

      {total > 0 && (
        <div className="mt-3.5">
          <div className="mb-1.5 flex items-center justify-between text-[12.5px] text-fg-2">
            <span>
              {total} de {maxFiles} archivos
            </span>
            {maxBytesTotal !== undefined && (
              <span className={cn("font-mono", excedido ? "text-danger" : "text-fg-2")}>
                {fmtBytes(bytes)} / {fmtBytes(maxBytesTotal)}
              </span>
            )}
          </div>

          {maxBytesTotal !== undefined && (
            <div className="mb-3.5 h-1.5 overflow-hidden rounded-full bg-cream-tert">
              <div
                className={cn("h-full transition-[width]", excedido ? "bg-danger" : "bg-green-800")}
                style={{ width: `${Math.min(100, (bytes / maxBytesTotal) * 100)}%` }}
              />
            </div>
          )}

          <div className="flex flex-col gap-2">
            {files.map((f, i) => (
              <Fila
                key={`${f.name}-${i}`}
                nombre={f.name}
                detalle={fmtBytes(f.size)}
                onQuitar={() => quitarArchivo(i)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
