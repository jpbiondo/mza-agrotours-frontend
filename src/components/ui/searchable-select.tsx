"use client";

import { useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";

/** Normaliza para búsqueda insensible a acentos y mayúsculas. */
const norm = (s: string) =>
  s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

interface SearchableSelectProps {
  id?: string;
  name?: string;
  value: string;
  onChange: (val: string) => void;
  onBlur?: () => void;
  ref?: React.Ref<HTMLButtonElement>;
  options: readonly string[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  icon?: React.ReactNode;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
}

/**
 * Select buscable genérico (Popover + Command). Opciones de texto, con búsqueda
 * insensible a acentos. Reenvía ref/onBlur/aria-* para react-hook-form.
 */
export function SearchableSelect({
  id, name, value, onChange, onBlur, ref, options, placeholder = "Seleccionar",
  searchPlaceholder = "Buscar…", emptyText = "Sin resultados", icon,
  "aria-invalid": ariaInvalid, "aria-describedby": describedBy,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const errored = ariaInvalid === true;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        ref={ref}
        id={id}
        name={name}
        onBlur={onBlur}
        aria-invalid={ariaInvalid}
        aria-describedby={describedBy}
        className={cn(
          "flex h-11 w-full items-center justify-between gap-2.5 rounded-md border border-input bg-surface px-3.5 text-base outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20",
          errored && "bg-danger-fill",
          value ? "text-fg-1" : "text-fg-3"
        )}
      >
        <span className="flex min-w-0 items-center gap-2.5">
          {icon && (
            <span
              className={cn(
                "inline-flex [&>svg]:size-[18px]",
                value ? "text-green-800" : errored ? "text-danger" : "text-fg-3"
              )}
            >
              {icon}
            </span>
          )}
          <span className="truncate">{value || placeholder}</span>
        </span>
        <ChevronDown className="size-4 shrink-0 text-fg-3" />
      </PopoverTrigger>

      <PopoverContent align="start" className="w-(--anchor-width) min-w-60 p-0">
        <Command filter={(v, search) => (norm(v).includes(norm(search)) ? 1 : 0)}>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {options.map((o) => {
                const sel = o === value;
                return (
                  <CommandItem
                    key={o}
                    value={o}
                    onSelect={() => {
                      onChange(o);
                      setOpen(false);
                    }}
                    className={cn(sel && "bg-green-050 font-semibold")}
                  >
                    <span className="flex-1">{o}</span>
                    {sel && <Check className="size-4 text-green-800" />}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
