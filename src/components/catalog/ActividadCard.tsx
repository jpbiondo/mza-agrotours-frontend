import Link from "next/link";
import { ArrowRight, MapPin, Warehouse } from "lucide-react";
import Photo, { seedDeId } from "@/components/landing/Photo";
import { CropChip } from "@/components/catalog/controls";
import { Skeleton, buttonClasses } from "@/components/ui";
import { moneyAr } from "@/lib/format";
import type { ActividadResumen } from "@/types/catalogo";

/**
 * Tarjeta de una actividad del catálogo público. La usan `/explorar` y las
 * destacadas de la landing: los dos endpoints devuelven el mismo DTO.
 */
export default function ActividadCard({
  act,
  cultivosIds = [],
}: {
  act: ActividadResumen;
  /** Cultivos filtrados en el listado, para resaltar su chip. */
  cultivosIds?: string[];
}) {
  return (
    <Link
      href={`/explorar/${act.id}`}
      className="flex flex-col overflow-hidden rounded-lg border border-outline-variant bg-surface no-underline transition-[box-shadow,border-color,transform] duration-150 hover:-translate-y-0.5 hover:border-sand hover:shadow-hover"
    >
      <div className="relative">
        {/* Sin foto cargada queda el degradado del propio id, estable entre pantallas. */}
        <Photo seed={seedDeId(act.id)} height={180} radius={0} src={act.fotoPortada?.url} alt={act.fotoPortada ? act.nombre : ""} />
      </div>

      <div className="flex flex-1 flex-col gap-3 p-[18px]">
        {act.nombreDepartamento && (
          <div className="flex items-center gap-1.5 text-[13px] text-fg-3">
            <MapPin size={14} className="text-brown-700" />
            <span className="font-medium text-fg-2">{act.nombreDepartamento}, Mendoza</span>
          </div>
        )}
        <h3 className="m-0 font-display text-[18.5px] leading-tight font-bold text-fg-1">{act.nombre}</h3>
        <div className="flex items-center gap-1.5 text-[13px] text-fg-3">
          <Warehouse size={14} className="shrink-0" />
          <span className="truncate">{act.nombreEstablecimiento}</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {act.cultivos.map((c) => <CropChip key={c.id} active={cultivosIds.includes(c.id)}>{c.nombre}</CropChip>)}
        </div>
        <div className="mt-auto flex items-end justify-between gap-3 border-t border-cream-tert pt-3.5">
          <div className="min-w-0">
            <div className="t-label mb-0.5">Desde</div>
            {/* Sin precio publicado todavía no hay monto que mostrar. */}
            {act.precioRegular === null ? (
              <span className="text-[14.5px] font-semibold text-fg-3">A consultar</span>
            ) : (
              <div className="flex items-baseline gap-[5px]">
                <span className="font-mono text-[19px] font-bold text-fg-1">{moneyAr(act.precioRegular)}</span>
                <span className="text-[12.5px] text-fg-3">/ persona</span>
              </div>
            )}
          </div>
          <span className={buttonClasses({ size: "sm", className: "shrink-0 whitespace-nowrap" })}>
            Ver detalle <ArrowRight size={16} />
          </span>
        </div>
      </div>
    </Link>
  );
}

/** Mismo alto que la tarjeta, para que nada salte al llegar los datos. */
export function ActividadCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg border border-outline-variant bg-surface">
      <Skeleton className="h-[180px] rounded-none" />
      <div className="flex flex-col gap-3 p-[18px]">
        <Skeleton className="h-3.5 w-2/5" />
        <Skeleton className="h-5 w-4/5" />
        <Skeleton className="h-3.5 w-3/5" />
        <Skeleton className="h-6 w-1/3 rounded-full" />
      </div>
    </div>
  );
}
