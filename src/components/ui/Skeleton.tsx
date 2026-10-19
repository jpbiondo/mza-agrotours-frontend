import { cn } from "@/lib/utils";

/**
 * Bloque que ocupa el lugar del contenido mientras carga. El tamaño lo pone
 * quien lo usa: la gracia del esqueleto es que mida parecido a lo que va a
 * reemplazar, para que nada salte cuando llegan los datos.
 *
 * `aria-hidden` porque no dice nada: el estado de carga se anuncia una sola vez
 * en el contenedor, no una por barra.
 *
 * Con `layout` dibuja un esqueleto entero de una forma conocida (ver
 * `SkeletonLayout`). Si la pantalla tiene una forma propia, se arma con bloques
 * sueltos, como hasta ahora.
 */
export function Skeleton({ className = "", ...layout }: { className?: string } & Partial<SkeletonLayoutProps>) {
  if (layout.layout) return <SkeletonLayout {...(layout as SkeletonLayoutProps)} className={className} />;
  return <div aria-hidden className={cn("animate-pulse rounded-md bg-cream-tert", className)} />;
}

type SkeletonLayoutProps =
  /** Lista de tarjetas horizontales (mis reservas, mis solicitudes). */
  | { layout: "list"; rows?: number; className?: string }
  /** Tabla dentro de una `Card`: cabecera + filas. */
  | { layout: "table"; rows?: number; cols?: number; className?: string }
  /** Grilla de tarjetas de catálogo con foto. */
  | { layout: "cards"; count?: number; className?: string }
  /** Detalle: título, bajada y un cuerpo a dos columnas. */
  | { layout: "detail"; className?: string };

/** El contenedor anuncia la carga una vez; las barras quedan `aria-hidden`. */
function Contenedor({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div role="status" aria-busy aria-label="Cargando…" className={className}>
      {children}
    </div>
  );
}

const Barra = ({ className }: { className?: string }) => (
  <div aria-hidden className={cn("animate-pulse rounded-md bg-cream-tert", className)} />
);

const Superficie = "overflow-hidden rounded-lg border border-outline-variant bg-surface";

export function SkeletonLayout(props: SkeletonLayoutProps) {
  switch (props.layout) {
    case "list":
      return (
        <Contenedor className={cn("grid grid-cols-1 gap-4", props.className)}>
          {Array.from({ length: props.rows ?? 3 }, (_, i) => (
            <div key={i} className={cn(Superficie, "flex")}>
              <Barra className="hidden h-40 w-52 shrink-0 rounded-none sm:block" />
              <div className="flex min-w-0 flex-1 flex-col gap-3 p-5">
                <Barra className="h-3 w-32" />
                <Barra className="h-5 w-3/5" />
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <Barra className="h-8" /><Barra className="h-8" /><Barra className="h-8" />
                </div>
              </div>
            </div>
          ))}
        </Contenedor>
      );

    case "table": {
      const cols = props.cols ?? 4;
      return (
        <Contenedor className={cn(Superficie, props.className)}>
          <div className="flex gap-6 border-b border-outline-variant px-4 py-3.5">
            {Array.from({ length: cols }, (_, j) => <Barra key={j} className="h-3 flex-1" />)}
          </div>
          {Array.from({ length: props.rows ?? 5 }, (_, i) => (
            <div key={i} className="flex items-center gap-6 border-b border-cream-tert px-4 py-4 last:border-b-0">
              {Array.from({ length: cols }, (_, j) => (
                <Barra key={j} className={cn("h-4 flex-1", j === 0 && "h-5")} />
              ))}
            </div>
          ))}
        </Contenedor>
      );
    }

    case "cards":
      return (
        <Contenedor className={cn("grid grid-cols-1 gap-6 min-[681px]:grid-cols-2 min-[1041px]:grid-cols-3", props.className)}>
          {Array.from({ length: props.count ?? 6 }, (_, i) => (
            <div key={i} className={Superficie}>
              <Barra className="h-44 rounded-none" />
              <div className="flex flex-col gap-3 p-4">
                <Barra className="h-3 w-24" />
                <Barra className="h-5 w-4/5" />
                <Barra className="h-3 w-1/2" />
                <Barra className="mt-2 h-8" />
              </div>
            </div>
          ))}
        </Contenedor>
      );

    case "detail":
      return (
        <Contenedor className={props.className}>
          <Barra className="h-3 w-40" />
          <Barra className="mt-4 h-9 w-2/3" />
          <Barra className="mt-3 h-4 w-1/2" />
          <div className="mt-8 grid grid-cols-1 items-start gap-6 min-[881px]:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
            <div className={cn(Superficie, "flex flex-col gap-3 p-6")}>
              <Barra className="h-5 w-1/3" />
              <Barra className="h-4" /><Barra className="h-4" /><Barra className="h-4 w-4/5" />
            </div>
            <div className={cn(Superficie, "flex flex-col gap-3 p-6")}>
              <Barra className="h-5 w-1/2" />
              <Barra className="h-10" />
            </div>
          </div>
        </Contenedor>
      );
  }
}
