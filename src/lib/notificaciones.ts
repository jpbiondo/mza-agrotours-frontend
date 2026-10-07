/** Enlace y etiqueta de fecha de una notificación. Lógica pura, sin fetch. */

/**
 * Las rutas que se aceptan del `urlLink`. Hoy el backend ya las arma con las
 * del front (`RutasNotificacionesFront`), pero las notificaciones creadas
 * antes de ese cambio quedaron guardadas con rutas suyas, que se traducen.
 * Esas dos filas se pueden borrar cuando no queden notificaciones viejas.
 *
 * Lo que no esté acá no se navega: el push del service worker abre el
 * `urlLink` tal cual, pero la campana sólo va a rutas conocidas.
 */
const RUTAS: Array<[RegExp, string]> = [
  // Rutas viejas del backend.
  [/^\/solicitudes-establecimiento\/me\/([^/?#]+)$/, "/mis-solicitudes/$1"],
  [/^\/reserva\/get\/([^/?#]+)$/, "/mis-reservas/$1"],
  // Rutas que ya son del front y coinciden tal cual.
  [/^\/establecimientos\/([^/?#]+)$/, "/establecimientos/$1"],
  [/^\/mis-solicitudes\/([^/?#]+)$/, "/mis-solicitudes/$1"],
  [/^\/mis-reservas\/([^/?#]+)$/, "/mis-reservas/$1"],
  [/^\/admin\/solicitudes\/([^/?#]+)$/, "/admin/solicitudes/$1"],
];

/**
 * Ruta del front a la que lleva la notificación, o `null` si el enlace no mapea
 * a ninguna. Se devuelve `null` en vez del link crudo a propósito: navegar a
 * una ruta del backend sería un 404, y una fila sin destino es mejor que eso.
 */
export function rutaDeNotificacion(urlLink: unknown): string | null {
  const url = typeof urlLink === "string" ? urlLink.trim() : "";
  // Sólo rutas internas: un link absoluto no se navega con el router.
  if (!url.startsWith("/")) return null;
  for (const [patron, destino] of RUTAS) {
    if (patron.test(url)) return url.replace(patron, destino);
  }
  return null;
}

const p2 = (n: number) => String(n).padStart(2, "0");
const hhmm = (d: Date) => `${p2(d.getHours())}:${p2(d.getMinutes())}`;
const mismoDia = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

/**
 * Etiqueta corta de recepción: "Hace 12 min", "Hoy · 11:40", "Ayer · 19:30",
 * "20/06 · 14:15". Las de más de un año llevan el año para no confundirse.
 *
 * `ahora` es parámetro para poder testear sin congelar el reloj.
 */
export function etiquetaFecha(iso: string | null, ahora: Date = new Date()): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";

  const minutos = Math.floor((ahora.getTime() - d.getTime()) / 60000);
  // Un alta en el futuro (relojes desfasados entre backend y navegador) cae acá
  // y se muestra como recién llegada, que es lo menos raro que puede decirse.
  if (minutos < 1) return "Recién";
  if (minutos < 60) return `Hace ${minutos} min`;
  if (minutos < 360) return `Hace ${Math.floor(minutos / 60)} h`;

  if (mismoDia(d, ahora)) return `Hoy · ${hhmm(d)}`;

  const ayer = new Date(ahora);
  ayer.setDate(ayer.getDate() - 1);
  if (mismoDia(d, ayer)) return `Ayer · ${hhmm(d)}`;

  if (d.getFullYear() === ahora.getFullYear()) {
    return `${p2(d.getDate())}/${p2(d.getMonth() + 1)} · ${hhmm(d)}`;
  }
  return `${p2(d.getDate())}/${p2(d.getMonth() + 1)}/${d.getFullYear()}`;
}
