/**
 * El "volver a donde estaba" del login: a qué ruta llevar después de iniciar
 * sesión. Viaja por `?volver=` en la URL de `/acceso`.
 *
 * Sólo se aceptan rutas internas. Un `volver` que llega por la URL lo puede
 * escribir cualquiera, y aceptar `https://…` o `//otro.sitio` convertiría el
 * login en un redirector abierto.
 */

export const RUTA_ACCESO = "/acceso";

/** Avisos que `/acceso` sabe mostrar por `?motivo=…`. */
export type MotivoAcceso = "sesion-vencida" | "email-actualizado";

/** La ruta del login, con el destino de vuelta y el motivo si los hay. */
export function rutaAcceso({ volver, motivo }: { volver?: string | null; motivo?: MotivoAcceso } = {}): string {
  const params = new URLSearchParams();
  const destino = destinoSeguro(volver);
  if (destino) params.set("volver", destino);
  if (motivo) params.set("motivo", motivo);
  const qs = params.toString();
  return qs ? `${RUTA_ACCESO}?${qs}` : RUTA_ACCESO;
}

/** La ruta en la que está el usuario ahora (sólo en el cliente). */
export function rutaActual(): string {
  if (typeof window === "undefined") return "";
  return window.location.pathname + window.location.search;
}

/**
 * `volver` si es una ruta interna a la que tiene sentido volver; si no, `null`.
 * Se descartan las del propio flujo de acceso y registro: volver al login
 * después de loguearse sería un loop.
 */
export function destinoSeguro(volver: string | null | undefined): string | null {
  if (!volver) return null;
  if (!volver.startsWith("/") || volver.startsWith("//") || volver.startsWith("/\\")) return null;
  if (volver === RUTA_ACCESO || volver.startsWith(`${RUTA_ACCESO}/`) || volver.startsWith(`${RUTA_ACCESO}?`)) return null;
  if (volver.startsWith("/registro")) return null;
  return volver;
}
