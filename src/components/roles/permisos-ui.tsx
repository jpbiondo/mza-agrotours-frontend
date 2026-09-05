import type { ComponentType } from "react";
import {
  CalendarCheck, Check, ClipboardCheck, Grape, KeyRound, ShieldCheck, UserCheck, UserCog,
  UserPen, Users, Warehouse,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { GrupoPermiso } from "@/types/roles";

/**
 * Los iconos son componentes, así que el slug que manda el backend se resuelve
 * acá. Es lo único del catálogo que el front tiene que conocer, y un slug nuevo
 * cae en el genérico en vez de romper la pantalla. Incluye los dos ámbitos: el
 * mapa no sabe —ni necesita saber— de qué catálogo vino el grupo.
 */
const GRUPO_ICONO: Record<string, ComponentType<{ className?: string }>> = {
  "user-cog": UserCog,
  "user-pen": UserPen,
  "user-check": UserCheck,
  "shield-check": ShieldCheck,
  "clipboard-check": ClipboardCheck,
  "calendar-check": CalendarCheck,
  "key-round": KeyRound,
  warehouse: Warehouse,
  grape: Grape,
  users: Users,
};

export function IconoGrupo({ icono, className }: { icono: string; className?: string }) {
  const Icono = GRUPO_ICONO[icono] ?? ShieldCheck;
  return <Icono className={className} />;
}

/** "Gestión de administradores" → "Administradores", para las píldoras de la tabla. */
function etiquetaGrupo(nombre: string): string {
  const corto = nombre.replace(/^gesti[oó]n de[l]?\s+/i, "").trim();
  return corto ? corto[0].toUpperCase() + corto.slice(1) : nombre;
}

/** Resumen de la columna Permisos: una píldora por grupo con cuántos tiene. */
export function PermSummary({ perms, grupos }: { perms: string[]; grupos: GrupoPermiso[] }) {
  if (!perms.length) return <span className="text-[13px] text-fg-3">Sin permisos</span>;

  const tiene = new Set(perms);
  const conteos = grupos
    .map((g) => ({ grupo: g, count: g.permisos.filter((p) => tiene.has(p.codigo)).length }))
    .filter((x) => x.count > 0);

  return (
    <span className="flex flex-wrap gap-1.5">
      {conteos.map(({ grupo, count }) => (
        <span
          key={grupo.nombre}
          className="inline-flex items-center gap-1.5 rounded-pill border border-green-300 bg-green-050 px-2.5 py-1 text-[12.5px] font-semibold whitespace-nowrap text-green-800"
        >
          <IconoGrupo icono={grupo.icono} className="size-[14px] text-green-700" />{" "}
          {etiquetaGrupo(grupo.nombre)} <span className="font-mono opacity-80">{count}</span>
        </span>
      ))}
    </span>
  );
}

/** Casillero cuadrado del editor de permisos; `mixed` = grupo a medio marcar. */
export function BigCheck({ state, className }: { state: "on" | "off" | "mixed"; className?: string }) {
  const filled = state !== "off";
  return (
    <span
      aria-hidden
      className={cn(
        "flex shrink-0 items-center justify-center rounded-[7px] border-2",
        filled ? "border-green-800 bg-green-800" : "border-sand bg-surface",
        className,
      )}
    >
      {state === "on" && <Check className="size-[14px] text-white" />}
      {state === "mixed" && <span className="h-[3px] w-3 rounded-sm bg-white" />}
    </span>
  );
}

/**
 * Un grupo del catálogo con sus permisos. El título hace de casillero padre:
 * marca o desmarca todos los hijos de una vez.
 */
export function PermGroupEditor({
  group,
  selected,
  onToggleGroup,
  onTogglePerm,
}: {
  group: GrupoPermiso;
  selected: Set<string>;
  onToggleGroup: (g: GrupoPermiso) => void;
  onTogglePerm: (codigo: string) => void;
}) {
  const count = group.permisos.filter((p) => selected.has(p.codigo)).length;
  const groupState = count === 0 ? "off" : count === group.permisos.length ? "on" : "mixed";

  return (
    <div className="overflow-hidden rounded-lg border border-outline-variant bg-surface">
      <button
        type="button"
        onClick={() => onToggleGroup(group)}
        className={cn(
          "flex w-full cursor-pointer items-center gap-3.5 border-b border-outline-variant px-4 py-3.5 text-left",
          groupState === "off" ? "bg-cream-tert" : "bg-green-050",
        )}
      >
        <BigCheck state={groupState} className="size-[25px]" />
        <span className="flex size-9 shrink-0 items-center justify-center rounded-[10px] border border-outline-variant bg-surface">
          <IconoGrupo icono={group.icono} className="size-[19px] text-green-800" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-display text-[16.5px] font-semibold text-fg-1">
            {group.nombre}
          </span>
          <span className="mt-0.5 block text-[12.5px] text-fg-3">{group.descripcion}</span>
        </span>
        <span
          className={cn(
            "rounded-pill border px-[11px] py-1 font-mono text-[12.5px] font-semibold whitespace-nowrap",
            count
              ? "border-green-300 bg-green-100 text-green-800"
              : "border-outline-variant bg-surface text-fg-3",
          )}
        >
          {count}/{group.permisos.length}
        </span>
      </button>

      <div className="flex flex-col gap-[3px] py-2.5 pr-2.5 pl-11">
        {group.permisos.map((p) => {
          const on = selected.has(p.codigo);
          return (
            <button
              key={p.codigo}
              type="button"
              onClick={() => onTogglePerm(p.codigo)}
              className={cn(
                "flex w-full cursor-pointer items-center gap-3.5 rounded-md border px-3.5 py-2.5 text-left",
                on ? "border-green-300 bg-green-050" : "border-transparent",
              )}
            >
              <BigCheck state={on ? "on" : "off"} className="size-[23px]" />
              <span className="min-w-0">
                <span
                  className={cn(
                    "block text-[15.5px]",
                    on ? "font-semibold text-green-800" : "font-medium text-fg-1",
                  )}
                >
                  {p.nombre || p.codigo}
                </span>
                {p.descripcion && (
                  <span className="mt-0.5 block text-[12.5px] text-fg-3">{p.descripcion}</span>
                )}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
