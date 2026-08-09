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
