"use client";

import { useState } from "react";
import Link from "next/link";
import { Compass, MapPin, Sprout } from "lucide-react";
import { buttonClasses } from "@/components/ui";
import { FilterSelect } from "@/components/catalog/controls";
import { SIN_FILTROS, useFacetasActividades } from "@/hooks/useCatalogoActividades";
import { useCultivosPopulares } from "@/hooks/useCultivosPopulares";
import { hrefExplorar } from "@/lib/filtrosExplorar";

/** Cuántos atajos de cultivo van debajo del buscador. */
const POPULARES = 4;

/**
 * Buscador del hero: cultivo y departamento, y "Explorar" lleva a `/explorar`
 * con esos filtros puestos. Ninguno es obligatorio: sin elegir nada va al
 * catálogo entero.
 *
 * Sin RHF a propósito: no hay nada que validar y lo único que produce es una
 * URL, igual que la barra de filtros del catálogo, cuyos selectores reusa.
 *
 * Cultivo es de a uno (en el catálogo es múltiple): acá conviene lo rápido, y
 * quien quiera más los suma allá. Las dos facetas se acotan entre sí, así que
 * nunca se ofrece una combinación sin actividades.
 */
export default function HeroBuscador() {
  const [cultivoId, setCultivoId] = useState<string | null>(null);
  const [departamentoId, setDepartamentoId] = useState<string | null>(null);
  const cultivosIds = cultivoId ? [cultivoId] : [];

  const facetas = useFacetasActividades({ ...SIN_FILTROS, cultivosIds, departamentoId });
  // Son un atajo: si no cargan o no hay, el buscador alcanza solo.
  const populares = useCultivosPopulares(POPULARES).data ?? [];

  return (
    <div className="max-w-[760px]">
      <div role="search" aria-label="Buscar experiencias" className="flex flex-wrap items-end gap-4 rounded-lg bg-surface p-5 shadow-pop">
        <FilterSelect
          icon={<Sprout size={18} />}
          label="Tipo de cultivo"
          allLabel={facetas.isLoading ? "Cargando cultivos…" : "Todos los cultivos"}
          value={cultivoId}
          options={facetas.data?.cultivos ?? []}
          onChange={setCultivoId}
        />
        <FilterSelect
          icon={<MapPin size={18} />}
          label="Departamento"
          allLabel={facetas.isLoading ? "Cargando departamentos…" : "Todos los departamentos"}
          value={departamentoId}
          options={facetas.data?.departamentos ?? []}
          onChange={setDepartamentoId}
        />
        <Link
          href={hrefExplorar({ cultivosIds, departamentoId })}
          className={buttonClasses({ size: "lg", className: "h-[46px] basis-full nav:basis-auto" })}
        >
          <Compass size={18} /> Explorar
        </Link>
      </div>

      {populares.length > 0 && (
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <span className="mr-1 text-sm text-white/80">Populares:</span>
          {populares.map((c) => (
            <Link
              key={c.value}
              href={hrefExplorar({ cultivosIds: [c.value] })}
              className="inline-flex items-center gap-1.5 rounded-pill bg-white/15 px-3.5 py-1.5 text-sm font-semibold text-white no-underline backdrop-blur-[4px] transition-colors hover:bg-white/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              <Sprout size={14} /> {c.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
