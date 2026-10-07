/**
 * Rutas del panel del productor. Todo cuelga del establecimiento, por UUID:
 * `/panel/{establecimientoId}/reservas`. La URL es la que dice en cuál se está
 * parado, así un link, un favorito o una pestaña nueva abren siempre el mismo.
 */
export const RAIZ_PANEL = "/panel";

/**
 * Secciones del panel: lo que va después del establecimiento. Sirve para
 * reconocer las URLs de antes del cambio, que no tenían id (`/panel/reservas`).
 */
const SECCIONES = new Set([
  "estadisticas", "actividades", "reservas", "chats", "datos", "productores", "roles",
]);

/** `/panel/{id}` más lo que se le pase, segmento a segmento. */
export function rutaPanel(establecimientoId: string, ...partes: string[]): string {
  return [RAIZ_PANEL, establecimientoId, ...partes].map((p, i) => (i === 0 ? p : encodeURIComponent(p))).join("/");
}

/** Los segmentos de `pathname` después de `/panel`: `["{id}", "reservas"]`. */
function segmentos(pathname: string): string[] {
  const partes = pathname.split("/").filter(Boolean);
  return partes[0] === "panel" ? partes.slice(1) : [];
}

/**
 * La misma sección en otro establecimiento, para el switcher. Se queda en la
 * raíz de la sección y no en el detalle: `actividades/{id}/editar` es de una
 * actividad del establecimiento anterior, y en el nuevo no existe.
 */
export function enOtroEstablecimiento(pathname: string, establecimientoId: string): string {
  const seccion = segmentos(pathname)[1];
  return seccion ? rutaPanel(establecimientoId, seccion) : rutaPanel(establecimientoId);
}

/**
 * A dónde mandar a quien entró con un id que no es suyo (o que ya no existe)
 * o con una URL vieja sin id.
 *
 * - `/panel/reservas` (URL vieja): la misma sección, en el establecimiento por
 *   defecto. Se conserva todo el resto del camino.
 * - `/panel/{idAjeno}/...`: la raíz del establecimiento por defecto. Lo que
 *   seguía era de otro establecimiento y no tiene sentido en este.
 */
export function rescatarRuta(pathname: string, establecimientoId: string): string {
  const [primero, ...resto] = segmentos(pathname);
  return primero && SECCIONES.has(primero)
    ? rutaPanel(establecimientoId, primero, ...resto)
    : rutaPanel(establecimientoId);
}
