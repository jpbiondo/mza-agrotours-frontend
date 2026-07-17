"use client";

import { useState } from "react";
import { Check, ChevronDown, Flag as FlagIcon } from "lucide-react";
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

/** Opción de país: `code` es el iso2 (para la bandera), `name` el nombre visible. */
export interface CountryOption {
  code: string;
  name: string;
}

/** Normaliza para búsqueda insensible a acentos y mayúsculas. */
const norm = (s: string) =>
  s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

function Flag({ code, size = 24 }: { code: string; size?: number }) {
  const h = Math.round(size * 0.75);
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`https://flagcdn.com/w40/${code.toLowerCase()}.png`}
      srcSet={`https://flagcdn.com/w80/${code.toLowerCase()}.png 2x`}
      width={size}
      height={h}
      alt=""
      className="block shrink-0 rounded-[3px] object-cover shadow-[inset_0_0_0_1px_rgba(0,0,0,.08)]"
      style={{ width: size, height: h }}
    />
  );
}

interface CountrySelectProps {
  id?: string;
  value: string;
  onChange: (val: string) => void;
  options: readonly CountryOption[];
  placeholder?: string;
  error?: string | false | null;
}

/** País + bandera, buscable. Trigger de shadcn Popover + lista con Command (cmdk). */
export function CountrySelect({
  id, value, onChange, options, placeholder, error,
}: CountrySelectProps) {
  const [open, setOpen] = useState(false);
  const errored = !!error;
  const selected =
    options.find((o) => o.code.toLowerCase() === value.toLowerCase()) ?? null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        id={id}
        aria-invalid={errored}
        className={cn(
          "flex h-11 w-full items-center justify-between gap-2.5 rounded-md border border-input bg-surface px-3.5 text-base text-fg-1 outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20",
          errored && "bg-danger-fill",
          !selected && "text-fg-3"
        )}
      >
        <span className="flex min-w-0 items-center gap-2.5">
          {selected ? (
            <Flag code={selected.code} />
          ) : (
            <FlagIcon
              className={cn("size-[18px]", errored ? "text-danger" : "text-fg-3")}
            />
          )}
          <span className="truncate">{selected ? selected.name : placeholder}</span>
        </span>
        <ChevronDown className="size-4 shrink-0 text-fg-3" />
      </PopoverTrigger>

      <PopoverContent align="start" className="w-(--anchor-width) min-w-60 p-0">
        <Command filter={(v, search) => (norm(v).includes(norm(search)) ? 1 : 0)}>
          <CommandInput placeholder="Buscar país…" />
          <CommandList>
            <CommandEmpty>Sin resultados</CommandEmpty>
            <CommandGroup>
              {options.map((o) => {
                const sel = o.code.toLowerCase() === value.toLowerCase();
                return (
                  <CommandItem
                    key={o.code}
                    value={o.name}
                    onSelect={() => {
                      onChange(o.code);
                      setOpen(false);
                    }}
                    className={cn(sel && "bg-green-050 font-semibold")}
                  >
                    <Flag code={o.code} />
                    <span className="flex-1">{o.name}</span>
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
