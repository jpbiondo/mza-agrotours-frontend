/**
 * URLs de los objetos del storage.
 *
 * El backend devuelve sólo la `key` del objeto, así que el link se arma en el
 * cliente con una URL base configurable. Esto implica que el bucket tiene que
 * ser de lectura pública: cualquiera con la key puede abrir el archivo.
 * TODO backend: para documentación privada conviene migrar a URLs de descarga
 * prefirmadas (como las de subida) o a un endpoint que haga de proxy con el token.
 */
const STORAGE_URL = process.env.NEXT_PUBLIC_STORAGE_URL ?? "";

/** `true` si hay una base configurada y por lo tanto se puede descargar. */
export const storageConfigurado = STORAGE_URL !== "";

/**
 * URL pública del objeto. `null` si falta la base o la key, para que la UI
 * pueda listar el archivo sin ofrecer una descarga rota.
 */
export function urlDeArchivo(key: string): string | null {
  const limpia = key?.trim().replace(/^\/+/, "") ?? "";
  if (!STORAGE_URL || !limpia) return null;
  return `${STORAGE_URL.replace(/\/+$/, "")}/${limpia}`;
}

/* ---- Subida con URL prefirmada ------------------------------------------- */

/**
 * PUT del archivo a su URL prefirmada. Nunca lanza: devuelve el motivo del
 * fallo, o `null` si salió bien.
 *
 * NO usa `apiFetch` a propósito: el destino es el bucket, no el backend.
 * `apiFetch` fuerza `Content-Type: application/json`, adjunta el ID token de
 * Firebase (filtrarlo a un host de terceros sería un problema de seguridad) y
 * hace `res.json()` sobre el 200/204 vacío del storage, que rompería.
 *
 * `contentType` tiene que ser el que devolvió el backend al firmar: lo decide
 * él a partir de la extensión y va dentro de la firma, así que mandar otro
 * hace fallar la validación V4.
 */
export async function putPrefirmado(
  uploadUrl: string,
  file: File,
  contentType: string,
): Promise<string | null> {
  try {
    const res = await fetch(uploadUrl, {
      method: "PUT",
      // Único header: cualquier extra puede romper la firma V4.
      headers: { "Content-Type": contentType },
      body: file,
    });
    return res.ok ? null : `HTTP ${res.status}`;
  } catch (e) {
    // Incluye el TypeError opaco de CORS: el navegador no lo distingue de un
    // fallo de red.
    return e instanceof Error ? e.message : "Error de red";
  }
}
