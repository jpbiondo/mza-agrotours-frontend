/**
 * Filtros de `/explorar` en la URL. Es el contrato entre el catálogo, que los
 * lee al cargar y los reescribe al cambiar, y quien linkea con filtros puestos
 * (el buscador del hero, los cultivos populares):
 *
 *   /explorar?q=malbec&cultivos=<uuid>&cultivos=<uuid>&departamento=<uuid>&pagina=2
 *
 * `pagina` es 1-based porque la lee una persona; el catálogo la pasa a 0-based.
 */
export interface FiltrosExplorar {
  busqueda: string;
  cultivosIds: string[];
  departamentoId: string | null;
  /** 0-based, igual que el `Pageable` del backend. */
  page: number;
}

type Params = Record<string, string | string[] | undefined>;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function todos(v: string | string[] | undefined): string[] {
  return v === undefined ? [] : Array.isArray(v) ? v : [v];
}

function primero(v: string | string[] | undefined): string {
  return todos(v)[0] ?? "";
}

/**
 * Lee los filtros de los `searchParams` de la página. Lo que no es un UUID se
 * descarta: un link viejo o editado a mano no tiene que terminar en un 400 del
 * backend, sino en el catálogo sin ese filtro.
 */
export function leerFiltrosExplorar(params: Params): FiltrosExplorar {
  const pagina = Number.parseInt(primero(params.pagina), 10);
  const departamento = primero(params.departamento);
  return {
    busqueda: primero(params.q).trim(),
    cultivosIds: [...new Set(todos(params.cultivos).filter((id) => UUID.test(id)))],
    departamentoId: UUID.test(departamento) ? departamento : null,
    page: Number.isFinite(pagina) && pagina > 1 ? pagina - 1 : 0,
  };
}

/** URL de `/explorar` con los filtros dados. Sin ninguno queda `/explorar` a secas. */
export function hrefExplorar({ busqueda = "", cultivosIds = [], departamentoId = null, page = 0 }: Partial<FiltrosExplorar> = {}): string {
  const qs = new URLSearchParams();
  const texto = busqueda.trim();
  if (texto) qs.set("q", texto);
  for (const id of cultivosIds) qs.append("cultivos", id);
  if (departamentoId) qs.set("departamento", departamentoId);
  if (page > 0) qs.set("pagina", String(page + 1));
  const s = qs.toString();
  return s ? `/explorar?${s}` : "/explorar";
}
