import Link from "next/link";
import { ArrowRight, Clock, Leaf, ListOrdered, UtensilsCrossed, Users } from "lucide-react";
import Photo, { seedDeId } from "@/components/landing/Photo";
import { EstadoBadge, Skeleton, buttonClasses } from "@/components/ui";
import type { DificultadId, RecetaResumen } from "@/types/recetas";

const DIFICULTAD_LABEL: Record<DificultadId, string> = {
  FACIL: "Fácil",
  MEDIA: "Media",
  DIFICIL: "Difícil",
};

function Stat({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.25 whitespace-nowrap">{icon}{children}</span>
  );
}

/**
 * Tarjeta de una receta del recetario público. La usan `/recetas` y el listado
 * de recetas del detalle de un cultivo.
 */
export default function RecetaCard({
  receta,
  sinCultivos = false,
}: {
  receta: RecetaResumen;
  /** En el detalle de un cultivo: todas las recetas lo comparten. */
  sinCultivos?: boolean;
}) {
  return (
    <Link
      href={`/recetas/${receta.id}`}
      className="flex flex-col overflow-hidden rounded-lg border border-outline-variant bg-surface no-underline transition-[box-shadow,border-color,transform] duration-150 hover:-translate-y-0.5 hover:border-sand hover:shadow-hover"
    >
      <div className="relative">
        {/* Decorativa: el nombre de la receta está debajo.
            Sin imagen cargada queda el degradado por seed. */}
        <Photo seed={seedDeId(receta.id)} height={180} radius={0} icon={UtensilsCrossed} src={receta.foto?.url} alt="" />
        <EstadoBadge tone="neutral" className="absolute top-3 left-3 shadow-hover">
          {DIFICULTAD_LABEL[receta.dificultad]}
        </EstadoBadge>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4.5">
        <h3 className="m-0 font-display text-[18.5px] leading-tight font-bold text-fg-1">{receta.nombre}</h3>

        <div className="flex flex-wrap items-center gap-3.5 text-[12.5px] text-fg-3">
          {/* El tiempo ya viene formateado del backend ("1 h 15 min"). */}
          {receta.tiempo && <Stat icon={<Clock size={13} />}>{receta.tiempo}</Stat>}
          <Stat icon={<Users size={13} />}>{receta.porciones} porc.</Stat>
          {/* Una receta publicada tiene al menos un paso: 0 es que no vino el dato. */}
          {receta.cantidadPasos > 0 && (
            <Stat icon={<ListOrdered size={13} />}>
              {receta.cantidadPasos} {receta.cantidadPasos === 1 ? "paso" : "pasos"}
            </Stat>
          )}
        </div>

        {!sinCultivos && receta.cultivos.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {receta.cultivos.map((c) => (
              <span
                key={c.id}
                className="inline-flex items-center gap-1.5 rounded-pill bg-cream-tert py-1 pr-2.5 pl-1.5 text-[11.5px] font-medium text-fg-2"
              >
                <span className="inline-flex size-3.75 shrink-0 items-center justify-center rounded-full bg-green-050">
                  <Leaf size={9} className="text-green-800" />
                </span>
                {c.nombre}
              </span>
            ))}
          </div>
        )}

        <div className="mt-auto flex justify-end border-t border-cream-tert pt-3.5">
          <span className={buttonClasses({ size: "sm", className: "shrink-0 whitespace-nowrap" })}>
            Ver receta <ArrowRight size={16} />
          </span>
        </div>
      </div>
    </Link>
  );
}

/** Mismo alto que la tarjeta, para que nada salte al llegar los datos. */
export function RecetaCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg border border-outline-variant bg-surface">
      <Skeleton className="h-45 rounded-none" />
      <div className="flex flex-col gap-3 p-4.5">
        <Skeleton className="h-5 w-3/5" />
        <Skeleton className="h-3.5 w-4/5" />
        <Skeleton className="h-3.5 w-2/5" />
      </div>
    </div>
  );
}
