"use client";

import { useState } from "react";
import { AlertTriangle, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui";
import { EDAD_MAX, EDAD_MIN, nuevaTarifa, soloDigitos, type ErroresActividad } from "@/lib/actividad-form";
import { cn } from "@/lib/utils";
import type { TarifaFila } from "@/types/actividad-form";
import { CajaCheck, FieldLabel } from "./campos";

/** Grilla compartida por el encabezado y cada fila, para que las columnas peguen. */
const GRILLA = "grid grid-cols-[26px_minmax(120px,1fr)_84px_84px_120px_100px_32px] items-center gap-2.5";

/** Campo de texto de la tabla. No usa <TextField> porque acá van más chicos. */
function Celda({
  value,
  onChange,
  onBlur,
  disabled,
  error,
  placeholder,
  maxLength,
  centrado,
  className,
  "aria-label": ariaLabel,
}: {
  value: string;
  onChange: (v: string) => void;
  onBlur: () => void;
  disabled?: boolean;
  error?: boolean;
  placeholder: string;
  maxLength?: number;
  centrado?: boolean;
  className?: string;
  "aria-label": string;
}) {
  return (
    <input
      type="text"
      value={value}
      disabled={disabled}
      placeholder={placeholder}
      maxLength={maxLength}
      aria-label={ariaLabel}
      aria-invalid={error || undefined}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      className={cn(
        "h-10 w-full min-w-0 rounded-md border border-input bg-surface px-2.5 text-sm text-fg-1 outline-none transition-colors",
        "placeholder:text-fg-3 focus-visible:border-green-800 focus-visible:ring-3 focus-visible:ring-green-800/20",
        centrado && "text-center font-mono",
        error && "border-danger bg-danger-fill",
        disabled && "cursor-not-allowed bg-cream-tert text-fg-3",
        className,
      )}
    />
  );
}

/**
 * Rangos etarios y su precio. Las tres filas que trae el formulario son una
 * plantilla: se renombran, se les cambian las edades, se agregan y se borran.
 * El backend recibe cada fila marcada como una tarifa con su rango explícito.
 */
export function TarifasEditor({
  filas,
  onChange,
  errs,
  intentado,
}: {
  filas: TarifaFila[];
  onChange: (filas: TarifaFila[]) => void;
  errs: ErroresActividad;
  intentado: boolean;
}) {
  const [tocados, setTocados] = useState<Set<string>>(() => new Set());
  const tocar = (k: string) => setTocados((t) => new Set(t).add(k));
  // Un campo vacío no se marca en rojo hasta que lo dejaste o intentaste guardar.
  const ver = (id: string, campo: string) =>
    intentado || tocados.has(`tar_${id}_${campo}`) ? errs[`tar_${id}_${campo}`] : undefined;

  const parchar = (id: string, p: Partial<TarifaFila>) =>
    onChange(filas.map((r) => (r.id === id ? { ...r, ...p } : r)));

  // Al desmarcar se limpian precio y base: dejarlos guardados haría que una
  // fila apagada siga contando como tarifa base al volver a marcarla.
  const alternar = (id: string) =>
    onChange(
      filas.map((r) =>
        r.id === id ? (r.on ? { ...r, on: false, precio: "", base: false } : { ...r, on: true }) : r,
      ),
    );

  const globales = [
    errs.tarOverlap,
    errs.tarDup,
    errs.tarBase === "No puedes tener más de una tarifa base en la misma actividad." ? errs.tarBase : null,
    ...(intentado ? [errs.tarNone, errs.tarBase] : []),
  ].filter((m, i, xs): m is string => !!m && xs.indexOf(m) === i);

  return (
    <div className="mb-[26px]">
      <FieldLabel required>Configurar precio según rango</FieldLabel>
      <p className="mb-3.5 max-w-[640px] text-[12.5px] leading-relaxed text-fg-3">
        Estas categorías son una plantilla: podés renombrarlas, ajustar sus edades, agregar nuevas o
        eliminarlas. Marcá las que apliquen a tu actividad y elegí cuál es la{" "}
        <strong className="font-semibold text-fg-2">tarifa base</strong>.
      </p>

      <div className="overflow-x-auto rounded-lg">
        <div className="min-w-[640px] overflow-hidden rounded-lg border border-outline-variant bg-surface">
          <div
            className={cn(
              GRILLA,
              "items-end border-b border-outline-variant bg-cream-tert px-3.5 py-2.5 text-[10.5px] font-bold tracking-[.06em] text-fg-3 uppercase",
            )}
          >
            <span />
            <span className="min-w-0">Nombre de la categoría</span>
            <span>Edad mín.</span>
            <span>Edad máx.</span>
            <span>Precio</span>
            <span className="text-center">Tarifa base</span>
            <span />
          </div>

          {filas.map((r) => {
            const off = !r.on;
            const eNombre = ver(r.id, "nombre");
            const ePrecio = ver(r.id, "precio");
            const eMin = ver(r.id, "min");
            const eMax = ver(r.id, "max");
            const eOrden = ver(r.id, "orden");
            const eOverlap = errs[`tar_${r.id}_overlap`];
            const eDup = errs[`tar_${r.id}_dup`];
            const detalle = [eOverlap, eDup, eOrden, eNombre, eMin, eMax, ePrecio].filter(Boolean);

            return (
              <div
                key={r.id}
                className={cn(
                  "border-t border-cream-tert px-3.5 py-3 transition-colors",
                  off ? "bg-cream-bg" : r.base ? "bg-green-050" : "bg-surface",
                )}
              >
                <div className={GRILLA}>
                  <button
                    type="button"
                    onClick={() => alternar(r.id)}
                    aria-pressed={r.on}
                    title={r.on ? "Quitar esta categoría" : "Usar esta categoría"}
                    aria-label={`${r.on ? "Quitar" : "Usar"} la categoría ${r.nombre || "sin nombre"}`}
                    className="flex cursor-pointer items-center"
                  >
                    <CajaCheck on={r.on} />
                  </button>

                  <Celda
                    aria-label="Nombre de la categoría"
                    value={r.nombre}
                    disabled={off}
                    error={!!eNombre || !!eDup}
                    placeholder="Ej. Adultos mayores"
                    onChange={(v) => parchar(r.id, { nombre: v })}
                    onBlur={() => tocar(`tar_${r.id}_nombre`)}
                  />

                  <Celda
                    aria-label="Edad mínima"
                    value={r.min}
                    disabled={off}
                    centrado
                    error={!!eMin || !!eOverlap || !!eOrden}
                    placeholder={String(EDAD_MIN)}
                    maxLength={3}
                    onChange={(v) => parchar(r.id, { min: soloDigitos(v).slice(0, 3) })}
                    onBlur={() => tocar(`tar_${r.id}_min`)}
                  />

                  <Celda
                    aria-label="Edad máxima"
                    value={r.max}
                    disabled={off}
                    centrado
                    error={!!eMax || !!eOverlap || !!eOrden}
                    placeholder={String(EDAD_MAX)}
                    maxLength={3}
                    onChange={(v) => parchar(r.id, { max: soloDigitos(v).slice(0, 3) })}
                    onBlur={() => tocar(`tar_${r.id}_max`)}
                  />

                  <div className="relative">
                    <span
                      className={cn(
                        "pointer-events-none absolute top-1/2 left-2.5 z-1 -translate-y-1/2 text-[13.5px]",
                        off ? "text-fg-3" : "text-fg-2",
                      )}
                    >
                      $
                    </span>
                    <Celda
                      aria-label="Precio"
                      value={r.precio}
                      disabled={off}
                      error={!!ePrecio}
                      placeholder="0"
                      className="pl-6 font-mono"
                      onChange={(v) => parchar(r.id, { precio: soloDigitos(v) })}
                      onBlur={() => tocar(`tar_${r.id}_precio`)}
                    />
                  </div>

                  <div className="flex justify-center">
                    <button
                      type="button"
                      disabled={off}
                      onClick={() => parchar(r.id, { base: !r.base })}
                      aria-pressed={r.base && r.on}
                      className={cn(
                        "inline-flex cursor-pointer items-center gap-1.5 rounded-pill border border-outline-variant bg-surface px-3 py-1.5 text-[12.5px] font-semibold text-fg-2 transition-colors",
                        r.base && r.on && "border-green-800 bg-green-800 text-fg-on-dark",
                        off && "cursor-not-allowed opacity-45",
                      )}
                    >
                      <span
                        className={cn(
                          "inline-block size-[11px] rounded-full border-[1.5px] border-sand",
                          r.base && r.on && "border-fg-on-dark bg-fg-on-dark ring-2 ring-green-800 ring-inset",
                        )}
                      />
                      Base
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => onChange(filas.filter((x) => x.id !== r.id))}
                    title="Eliminar rango"
                    aria-label={`Eliminar el rango ${r.nombre || "sin nombre"}`}
                    className="inline-flex size-8 cursor-pointer items-center justify-center rounded-md text-fg-3 transition-colors hover:bg-cream-tert hover:text-danger-fg"
                  >
                    <Trash2 className="size-[15px]" />
                  </button>
                </div>

                {detalle.length > 0 && (
                  <div className="mt-1.5 ml-9 flex flex-col gap-0.5">
                    {/* Se muestra un solo mensaje por fila: los de rango pisan a
                        los de campo faltante, que son más obvios en el propio campo. */}
                    <span className="err-msg">
                      <AlertTriangle className="size-[13px] shrink-0 text-danger" />
                      {detalle[0]}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <Button variant="neutral" size="sm" onClick={() => onChange([...filas, nuevaTarifa()])}>
          <Plus className="size-[15px]" /> Agregar rango etario
        </Button>
        <span className="text-xs text-fg-3">
          Valores enteros entre {EDAD_MIN} y {EDAD_MAX} años.
        </span>
      </div>

      {globales.length > 0 && (
        <div className="mt-3.5 flex items-start gap-2.5 rounded-md border border-danger bg-danger-fill px-3.5 py-3 text-[13px] leading-normal text-danger-fg">
          <AlertTriangle className="mt-px size-4 shrink-0" />
          <div className="flex flex-col gap-1">
            {globales.map((m) => (
              <span key={m}>{m}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
