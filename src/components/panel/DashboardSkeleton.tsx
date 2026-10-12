import { Card, Skeleton } from "@/components/ui";

/**
 * Esqueleto del resumen del panel. Lo usan el dashboard mientras carga y
 * `/panel` a secas mientras decide a qué establecimiento redirigir: como el
 * primero termina en el segundo, se ve un solo esqueleto de punta a punta en
 * vez de blanco → spinner → contenido.
 */
export default function DashboardSkeleton() {
  return (
    <div aria-busy="true" aria-label="Cargando tu panel…" className="mx-auto max-w-[1240px] px-7 pt-8 pb-20">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-60">
          <Skeleton className="h-9 w-32" />
          <Skeleton className="mt-2.5 h-5 w-80 max-w-full" />
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-11 w-32 rounded-pill" />
          <Skeleton className="h-11 w-48 rounded-pill" />
        </div>
      </div>

      <div className="mb-10 grid grid-cols-[repeat(auto-fit,minmax(210px,1fr))] gap-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Card key={i} className="p-4">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="mt-3.5 h-8 w-20" />
            <Skeleton className="mt-2 h-3.5 w-24" />
          </Card>
        ))}
      </div>

      <div className="grid items-start gap-6 min-[901px]:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Card className="overflow-hidden">
          <div className="border-b border-outline-variant px-6 py-[18px]">
            <Skeleton className="h-6 w-44" />
          </div>
          <div className="flex flex-col gap-3 p-6">
            {Array.from({ length: 5 }, (_, i) => <Skeleton key={i} className="h-7" />)}
          </div>
        </Card>
        <Card className="p-4">
          <Skeleton className="mb-4 h-6 w-40" />
          <div className="flex flex-col gap-3.5">
            {Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-10" />)}
          </div>
        </Card>
      </div>
    </div>
  );
}
