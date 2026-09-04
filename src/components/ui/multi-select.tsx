"use client";

import { useState } from "react";
import { Check, ChevronDown, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export interface MultiSelectOption {
  id: string;
  label: string;
  /** Texto secundario alineado a la derecha de la opción. */
  hint?: string;
}

interface MultiSelectProps {
  options: MultiSelectOption[];
  /** Ids elegidos, en el orden en que se fueron agregando. */
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  emptyText?: string;
  loadingText?: string;
  isLoading?: boolean;
  error?: boolean;
  "aria-label"?: string;
}

/**
 * Selección múltiple con los elegidos como chips adentro del campo. Cada chip
 * se puede quitar sin abrir el desplegable, que es lo que se espera cuando ya
 * hay varios cargados.
 */
export function MultiSelect({
  options, value, onChange, placeholder = "Seleccionar", emptyText = "No hay opciones disponibles",
  loadingText = "Cargando…", isLoading, error, "aria-label": ariaLabel,
}: MultiSelectProps) {
  const [open, setOpen] = useState(false);

  const alternar = (id: string) =>
    onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);

  // Un id elegido que ya no está en el catálogo igual se muestra: mejor un chip
  // con el id crudo que perderlo en silencio al guardar.
  const etiqueta = (id: string) => options.find((o) => o.id === id)?.label ?? id;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        aria-label={ariaLabel}
        aria-invalid={error || undefined}
        className={cn(
          "flex min-h-11 w-full items-center justify-between gap-2 rounded-md border border-input bg-surface px-2.5 py-1.5 text-left text-base outline-none transition-colors",
          "focus-visible:border-green-800 focus-visible:ring-3 focus-visible:ring-green-800/20",
          error && "border-danger bg-danger-fill",
        )}
      >
        <span className="flex flex-1 flex-wrap items-center gap-1.5">
          {value.length === 0 && <span className="pl-1 text-fg-3">{placeholder}</span>}
          {value.map((id) => (
            <span
              key={id}
              // El chip vive dentro del botón que abre el desplegable, así que
              // no puede ser otro <button>: va como <span> con rol de botón y
              // frena la propagación para que quitar no abra el menú.
              role="button"
              tabIndex={-1}
              aria-label={`Quitar ${etiqueta(id)}`}
              onClick={(e) => {
                e.stopPropagation();
                alternar(id);
              }}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-pill bg-green-100 px-2.5 py-1 text-[13px] font-semibold text-green-800"
            >
              {etiqueta(id)}
              <X className="size-[13px]" />
            </span>
          ))}
        </span>
        <ChevronDown
          className={cn("size-[18px] shrink-0 text-fg-2 transition-transform", open && "rotate-180")}
        />
      </PopoverTrigger>

      <PopoverContent align="start" className="max-h-[280px] w-(--anchor-width) min-w-60 gap-0 overflow-y-auto p-1.5">
        {isLoading && <p className="px-3 py-2.5 text-sm text-fg-3">{loadingText}</p>}
        {!isLoading && options.length === 0 && <p className="px-3 py-2.5 text-sm text-fg-3">{emptyText}</p>}
        {!isLoading &&
          options.map((o) => {
            const elegido = value.includes(o.id);
            return (
              <button
                key={o.id}
                type="button"
                onClick={() => alternar(o.id)}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-sm px-3 py-2.5 text-left text-sm text-fg-1 transition-colors hover:bg-cream-tert",
                  elegido && "bg-green-050 hover:bg-green-050",
                )}
              >
                <span
                  className={cn(
                    "inline-flex size-[18px] shrink-0 items-center justify-center rounded-[5px] border-[1.5px] border-sand",
                    elegido && "border-green-800 bg-green-800",
                  )}
                >
                  {elegido && <Check className="size-[13px] text-fg-on-dark" />}
                </span>
                <span className="flex-1">{o.label}</span>
                {o.hint && <span className="text-xs text-fg-3">{o.hint}</span>}
              </button>
            );
          })}
      </PopoverContent>
    </Popover>
  );
}
