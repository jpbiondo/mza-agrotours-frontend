import type { AsyncState } from "@/hooks/useAsync";
import { useFiltroCultivosActividad } from "@/hooks/useCatalogoActividades";
import { useFiltroCultivos } from "@/hooks/useCatalogoEstablecimientos";
import type { FilterOption } from "@/types/catalogo";

/**
 * Cultivos más comunes de la provincia, para los atajos del hero: los que
 * trabajan más establecimientos, sin filtrar por departamento.
 *
 * El ranking sale de la faceta de establecimientos, pero el atajo lleva a
 * `/explorar`, que lista actividades. Por eso se cruza con la faceta de
 * actividades: un cultivo con fincas pero sin ninguna actividad publicada
 * llevaría a un listado vacío, y ese no se ofrece.
 */
export function useCultivosPopulares(cantidad: number): Pick<AsyncState<FilterOption[]>, "data" | "isLoading" | "error"> {
  const establecimientos = useFiltroCultivos();
  const actividades = useFiltroCultivosActividad({ busqueda: "", departamentoId: null });

  const isLoading = establecimientos.isLoading || actividades.isLoading;
  const error = establecimientos.error ?? actividades.error;
  if (isLoading || error || !establecimientos.data || !actividades.data) return { data: null, isLoading, error };

  const conActividades = new Set(actividades.data.filter((o) => (o.count ?? 0) > 0).map((o) => o.value));
  const data = establecimientos.data
    .filter((o) => (o.count ?? 0) > 0 && conActividades.has(o.value))
    // A igual cantidad, alfabético: la faceta ya viene ordenada por nombre y el sort es estable.
    .sort((a, b) => (b.count ?? 0) - (a.count ?? 0))
    .slice(0, cantidad);
  return { data, isLoading: false, error: null };
}
