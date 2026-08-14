import { auth } from "../../firebase.config";

/**
 * Corre `fn` con el ID token de Firebase; lanza si no hay sesión.
 *
 * Va acá y no en `lib/api` a propósito: el cliente HTTP no conoce Firebase —
 * recibe el token como un string cualquiera— y conviene que siga así.
 */
export async function conToken<T>(fn: (token: string) => Promise<T>): Promise<T> {
  const user = auth.currentUser;
  if (!user) throw new Error("Sin sesión");
  return fn(await user.getIdToken());
}
