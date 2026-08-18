/**
 * Cliente HTTP mínimo contra el backend Spring.
 *
 * Convención (ver discusión de contratos de error):
 * - En 2xx el backend responde un envelope `{ ok, code, data }`; el llamador ramifica
 *   sobre `code`. (También se acepta `{ ok:false, code }` en 2xx para errores de dominio.)
 * - Un status no-2xx hace `throw ApiError`. Además del `status`, el error expone el
 *   `code` del cuerpo si el backend lo incluyó → permite modelar errores de dominio con
 *   HTTP semántico (p. ej. 409 Conflict con `{ code:"usuarioAlreadyExists" }`). Si no hay
 *   `code` (fallo técnico: red, 5xx, 403 de auth…), el llamador muestra un mensaje genérico.
 *
 * Nunca persiste el ID token: se pasa por request y lo administra el SDK de Firebase.
 */
const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

/** Error de una respuesta no-2xx. `code` es el del cuerpo (si vino); `body` el crudo. */
export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly body?: unknown;

  constructor(status: number, code?: string, body?: unknown) {
    super(`Backend respondió ${status}${code ? ` (${code})` : ""}`);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.body = body;
  }
}

interface ApiOptions extends Omit<RequestInit, "headers"> {
  /** ID token de Firebase; se envía como `Authorization: Bearer <token>`. */
  token?: string;
  headers?: Record<string, string>;
}

export async function apiFetch<T>(path: string, opts: ApiOptions = {}): Promise<T> {
  const { token, headers, ...rest } = opts;

  const res = await fetch(`${BASE_URL}${path}`, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  });

  if (!res.ok) {
    // El backend puede usar 4xx para errores de dominio con un `code` en el cuerpo.
    // Lo recuperamos (si existe) y lo adjuntamos al error; si no hay code, el llamador
    // lo tratará como fallo técnico (mensaje genérico).
    let body: unknown;
    try {
      body = await res.json();
    } catch {
      // Respuesta sin cuerpo JSON (o vacía).
    }
    const code = (body as { code?: string } | undefined)?.code;
    throw new ApiError(res.status, code, body);
  }

  return res.json() as Promise<T>;
}

/** Respuesta 2xx del backend: `data` sólo es fiable cuando `ok` es true. */
export interface Envelope<T> {
  ok: boolean;
  code?: string;
  data?: T;
}

/**
 * Normaliza la respuesta al envelope `{ ok, code, data }`. Sigue aceptando el
 * payload crudo —un array o un objeto suelto— por si algún endpoint todavía no
 * lo envuelve; en ese caso se asume éxito.
 *
 * Importante: conserva el `code` cuando `ok` es false, que es como el backend
 * manda los errores de dominio con status 2xx.
 */
export function comoEnvelope<T>(res: unknown): Envelope<T> {
  if (res && typeof res === "object" && "ok" in res) {
    const env = res as Envelope<T>;
    return { ok: env.ok, code: env.code, data: env.data };
  }
  return { ok: true, data: (res as T) ?? undefined };
}
