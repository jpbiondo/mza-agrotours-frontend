import { Card, Skeleton } from "@/components/ui";

/**
 * Esqueleto del inicio del panel. Lo usan el inicio mientras carga y `/panel`
 * a secas mientras decide a qué establecimiento redirigir: como el primero
 * termina en el segundo, se ve un solo esqueleto de punta a punta en vez de
 * blanco → spinner → contenido.
 */
export default function DashboardSkeleton() {
  return (
    <div aria-busy="true" aria-label="Cargando tu panel…" className="mx-auto max-w-[1240px] px-4 pt-8 pb-20 sm:px-7">
      <div className="mb-6">
        <Skeleton className="h-9 w-64 max-w-full" />
        <Skeleton className="mt-2.5 h-5 w-80 max-w-full" />
      </div>

      <div className="mb-6 grid grid-cols-3 gap-3">
        {Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-[66px] rounded-md" />)}
      </div>

      <Card className="mb-6 px-6 py-5">
        <Skeleton className="h-3.5 w-44" />
        <div className="mt-4 grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-4">
          {Array.from({ length: 2 }, (_, i) => <Skeleton key={i} className="h-10" />)}
        </div>
      </Card>

      <div className="grid items-start gap-6 min-[1100px]:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]">
        <Card className="overflow-hidden">
          <div className="px-6 py-5">
            <Skeleton className="h-6 w-44" />
            <Skeleton className="mt-2 h-4 w-56" />
          </div>
          <div className="flex flex-col gap-3 border-t border-cream-tert p-6">
            {Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-12" />)}
          </div>
        </Card>
        <div className="flex flex-col gap-6">
          {Array.from({ length: 2 }, (_, i) => (
            <Card key={i} className="px-6 py-5">
              <Skeleton className="mb-4 h-6 w-40" />
              <div className="flex flex-col gap-3.5">
                {Array.from({ length: 3 }, (_, j) => <Skeleton key={j} className="h-10" />)}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
