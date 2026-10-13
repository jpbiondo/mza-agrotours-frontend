import Link from "next/link";
import { ArrowRight, Building2, CalendarDays, MapPin } from "lucide-react";
import Photo, { seedDeId } from "@/components/landing/Photo";
import { CropChip } from "@/components/catalog/controls";
import { Skeleton } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { EstablecimientoResumen } from "@/types/catalogo";

/**
 * Tarjeta de un establecimiento del catálogo público. La usan
 * `/establecimientos` y los destacados de la landing: los dos endpoints
 * devuelven el mismo DTO.
 */
export default function EstablecimientoCard({
  est,
  cultivosIds = [],
}: {
  est: EstablecimientoResumen;
  /** Cultivos filtrados en el catálogo, para resaltar su chip. */
  cultivosIds?: string[];
}) {
  return (
    <Link
      href={`/establecimientos/${est.id}`}
      className="flex flex-col overflow-hidden rounded-lg border border-outline-variant bg-surface no-underline transition-[box-shadow,border-color,transform] duration-150 hover:-translate-y-0.5 hover:border-sand hover:shadow-hover"
    >
      <div className="relative">
        {/* Decorativa: el nombre de la finca ya está en el encabezado de al lado.
            Sin portada cargada queda el degradado por seed. */}
        <Photo seed={seedDeId(est.id)} height={150} radius={0} src={est.foto?.url} alt="" />
        {est.departamento && (
          <span className="absolute top-3 left-3 inline-flex items-center gap-[5px] rounded-pill bg-cream-bg/95 px-[11px] py-[5px] shadow-[0_2px_8px_rgba(45,90,39,.16)]">
            <MapPin size={13} className="text-brown-700" />
            <span className="text-[12.5px] font-semibold text-fg-1">{est.departamento.nombre}</span>
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-[11px] p-[18px]">
        <div>
          <h3 className="m-0 font-display text-[18.5px] leading-tight font-bold text-fg-1">{est.nombre}</h3>
          <div className="mt-[5px] flex items-center gap-1.5 text-[13px] text-fg-3">
            <Building2 size={14} className="shrink-0" />
            <span className="truncate">{est.razonSocial}</span>
          </div>
        </div>

        <p className={cn("m-0 line-clamp-3 text-sm leading-[1.55]", est.descripcion ? "text-fg-2" : "text-fg-3 italic")}>
          {est.descripcion || "Todavía no cargó una descripción."}
        </p>

        <div className="flex flex-wrap gap-1.5">
          {est.cultivos.map((c) => <CropChip key={c.id} active={cultivosIds.includes(c.id)}>{c.nombre}</CropChip>)}
        </div>

        <div className="mt-auto flex items-center justify-between gap-2.5 border-t border-cream-tert pt-3.5">
          <span className="inline-flex items-center gap-[5px] text-[12.5px] text-fg-3">
            <CalendarDays size={13} className="text-brown-700" />
            {est.cantidadActividades} {est.cantidadActividades === 1 ? "actividad" : "actividades"}
          </span>
          <span className="inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-green-800">
            Ver establecimiento <ArrowRight size={16} />
          </span>
        </div>
      </div>
    </Link>
  );
}

/** Mismo alto que la tarjeta, para que nada salte al llegar los datos. */
export function EstablecimientoCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg border border-outline-variant bg-surface">
      <Skeleton className="h-[150px] rounded-none" />
      <div className="flex flex-col gap-[11px] p-[18px]">
        <Skeleton className="h-5 w-3/5" />
        <Skeleton className="h-3.5 w-2/5" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-4/5" />
        <Skeleton className="h-6 w-1/3 rounded-full" />
      </div>
    </div>
  );
}
