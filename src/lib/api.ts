/**
 * Cliente HTTP mínimo contra el backend Spring.
 *
 * Convención (ver discusión de contratos de error):
 * - El backend responde 2xx con un envelope `{ ok, code, data }` para resultados de
 *   dominio (incluidos los "esperados" como badCreds); el llamador ramifica sobre `code`.
 * - Cualquier fallo técnico (red caída, 5xx, 4xx inesperado) hace `throw`, para que el
 *   llamador lo trate como error genérico y no lo confunda con un resultado de dominio.
 *
 * Nunca persiste el ID token: se pasa por request y lo administra el SDK de Firebase.
 */
const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

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
    // Fallo técnico: lo distinguimos de un resultado de dominio 2xx.
    throw new Error(`Backend respondió ${res.status}`);
  }

  return res.json() as Promise<T>;
}
