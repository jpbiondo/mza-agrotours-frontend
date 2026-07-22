"use client";

import { useRef, useState } from "react";
import {
  UploadCloud, FileText, Image as ImageIcon, File as FileIcon, Trash2, AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function fmtBytes(b: number): string {
  if (b < 1024) return b + " B";
  if (b < 1024 * 1024) return (b / 1024).toFixed(0) + " KB";
  return (b / (1024 * 1024)).toFixed(1) + " MB";
}

function fileIconFor(name: string) {
  const ext = (name.split(".").pop() || "").toLowerCase();
  if (ext === "pdf") return FileText;
  if (["png", "jpg", "jpeg", "webp", "gif", "heic"].includes(ext)) return ImageIcon;
  return FileIcon;
}

interface FileUploaderProps {
  files: File[];
  onAdd: (files: File[]) => void;
  onRemove: (index: number) => void;
  error?: string | null;
  maxFiles: number;
  maxBytes: number;
}

/** Uploader de pruebas: drop zone + lista con barra de tamaño total. */
export function FileUploader({
  files, onAdd, onRemove, error, maxFiles, maxBytes,
}: FileUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const total = files.reduce((s, f) => s + f.size, 0);
  const pct = Math.min(100, (total / maxBytes) * 100);
  const over = total > maxBytes;

  const pick = (list: FileList | null) => {
    if (!list) return;
    onAdd(Array.from(list));
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div>
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
            ? "border-brown-700 bg-brown-200"
            : "border-brown-700 bg-brown-100"
        )}
      >
        <UploadCloud className="size-[34px] text-brown-700" />
        <div className="font-display text-[15.5px] font-semibold text-brown-800">
          Arrastrá y soltá los archivos aquí, o examiná tu equipo
        </div>
        <div className="text-[12.5px] text-brown-800/85">
          Hasta {maxFiles} archivos · máximo {fmtBytes(maxBytes)} en total · PDF, JPG o PNG
        </div>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".pdf,.png,.jpg,.jpeg,.webp"
          className="hidden"
          onChange={(e) => pick(e.target.files)}
        />
      </div>

      {error && (
        <div className="mt-2 flex items-center gap-1.5 text-[12.5px] text-danger-fg">
          <AlertCircle className="size-3.5 shrink-0" /> {error}
        </div>
      )}

      {files.length > 0 && (
        <div className="mt-3.5">
          <div className="mb-1.5 flex items-center justify-between text-[12.5px] text-fg-2">
            <span>
              {files.length} de {maxFiles} archivos
            </span>
            <span className={cn("font-mono", over ? "text-danger" : "text-fg-2")}>
              {fmtBytes(total)} / {fmtBytes(maxBytes)}
            </span>
          </div>
          <div className="mb-3.5 h-1.5 overflow-hidden rounded-full bg-cream-tert">
            <div
              className={cn("h-full transition-[width]", over ? "bg-danger" : "bg-green-800")}
              style={{ width: pct + "%" }}
            />
          </div>
          <div className="flex flex-col gap-2">
            {files.map((f, i) => {
              const Icon = fileIconFor(f.name);
              return (
                <div
                  key={i}
                  className="flex items-center gap-3 rounded-md border border-outline-variant bg-surface px-3 py-2.5"
                >
                  <span className="inline-flex size-[34px] shrink-0 items-center justify-center rounded-lg bg-green-050">
                    <Icon className="size-[17px] text-green-800" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13.5px] font-medium text-fg-1">{f.name}</span>
                    <span className="mt-px block font-mono text-[11.5px] text-fg-3">{fmtBytes(f.size)}</span>
                  </span>
                  <button
                    type="button"
                    aria-label={`Quitar ${f.name}`}
                    onClick={() => onRemove(i)}
                    className="inline-flex size-[30px] shrink-0 cursor-pointer items-center justify-center rounded-lg border border-outline-variant bg-surface hover:bg-cream-tert"
                  >
                    <Trash2 className="size-[15px] text-danger" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
