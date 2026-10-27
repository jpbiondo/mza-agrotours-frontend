import { moneyAr } from "@/lib/format";
import type { ConsultaActividades, DireccionOrden, RangoPrecio } from "@/types/catalogo";

/**
 * Filtros de `/explorar` en la URL. Es el contrato entre el catálogo, que los
 * lee al cargar y los reescribe al cambiar, y quien linkea con filtros puestos
 * (el buscador del hero, los cultivos populares):
 *
 *   /explorar?q=malbec&cultivos=<uuid>&cultivos=<uuid>&departamento=<uuid>
 *     &precioDesde=8000&precioHasta=12000&estrellas=4
 *     &ordenPrecio=asc&ordenPuntuacion=desc&pagina=2
 *
 * `pagina` es 1-based porque la lee una persona; el catálogo la pasa a 0-based.
 */
export type FiltrosExplorar = Omit<ConsultaActividades, "size">;

type Params = Record<string, string | string[] | undefined>;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function todos(v: string | string[] | undefined): string[] {
  return v === undefined ? [] : Array.isArray(v) ? v : [v];
}

function primero(v: string | string[] | undefined): string {
  return todos(v)[0] ?? "";
}

/** Monto positivo, o `null`: el backend rechaza el cero y los negativos. */
function monto(v: string | string[] | undefined): number | null {
  const n = Number(primero(v));
  return primero(v) !== "" && Number.isFinite(n) && n > 0 ? n : null;
}

function direccion(v: string | string[] | undefined): DireccionOrden | null {
  const d = primero(v);
  return d === "asc" || d === "desc" ? d : null;
}

/**
 * Lee los filtros de los `searchParams` de la página. Lo que no tiene la forma
 * esperada se descarta: un link viejo o editado a mano no tiene que terminar en
 * un 400 del backend, sino en el catálogo sin ese filtro.
 */
export function leerFiltrosExplorar(params: Params): FiltrosExplorar {
  const pagina = Number.parseInt(primero(params.pagina), 10);
  const departamento = primero(params.departamento);
  const desde = monto(params.precioDesde);
  const hasta = monto(params.precioHasta);
  const estrellas = Number.parseInt(primero(params.estrellas), 10);
  return {
    busqueda: primero(params.q).trim(),
    cultivosIds: [...new Set(todos(params.cultivos).filter((id) => UUID.test(id)))],
    departamentoId: UUID.test(departamento) ? departamento : null,
    // Un rango al revés no trae nada: se toma como que no hay filtro.
    precio: (desde !== null || hasta !== null) && !(desde !== null && hasta !== null && desde >= hasta)
      ? { desde, hasta }
      : null,
    puntuacionMin: estrellas >= 1 && estrellas <= 5 ? estrellas : null,
    ordenPrecio: direccion(params.ordenPrecio),
    ordenPuntuacion: direccion(params.ordenPuntuacion),
    page: Number.isFinite(pagina) && pagina > 1 ? pagina - 1 : 0,
  };
}

/** URL de `/explorar` con los filtros dados. Sin ninguno queda `/explorar` a secas. */
export function hrefExplorar({
  busqueda = "", cultivosIds = [], departamentoId = null, precio = null, puntuacionMin = null,
  ordenPrecio = null, ordenPuntuacion = null, page = 0,
}: Partial<FiltrosExplorar> = {}): string {
  const qs = new URLSearchParams();
  const texto = busqueda.trim();
  if (texto) qs.set("q", texto);
  for (const id of cultivosIds) qs.append("cultivos", id);
  if (departamentoId) qs.set("departamento", departamentoId);
  if (precio?.desde) qs.set("precioDesde", String(precio.desde));
  if (precio?.hasta) qs.set("precioHasta", String(precio.hasta));
  if (puntuacionMin !== null) qs.set("estrellas", String(puntuacionMin));
  if (ordenPrecio) qs.set("ordenPrecio", ordenPrecio);
  if (ordenPuntuacion) qs.set("ordenPuntuacion", ordenPuntuacion);
  if (page > 0) qs.set("pagina", String(page + 1));
  const s = qs.toString();
  return s ? `/explorar?${s}` : "/explorar";
}

/** "Hasta $ 8.000", "$ 8.000 – $ 12.000" o "Desde $ 16.000". */
export function etiquetaRangoPrecio({ desde, hasta }: RangoPrecio): string {
  if (desde === null && hasta !== null) return `Hasta ${moneyAr(hasta)}`;
  if (hasta === null && desde !== null) return `Desde ${moneyAr(desde)}`;
  return `${moneyAr(desde ?? 0)} – ${moneyAr(hasta ?? 0)}`;
}

export function mismoRango(a: RangoPrecio | null, b: RangoPrecio | null): boolean {
  return a?.desde === b?.desde && a?.hasta === b?.hasta;
}
