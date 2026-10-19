import type { User } from "firebase/auth";
import { auth } from "../../firebase.config";
import { ApiError } from "@/lib/api";
import { rutaAcceso, rutaActual } from "@/lib/volver";

/**
 * Corre `fn` con el ID token de Firebase; lanza si no hay sesión.
 *
 * Va acá y no en `lib/api` a propósito: el cliente HTTP no conoce Firebase —
 * recibe el token como un string cualquiera— y conviene que siga así.
 */
export async function conToken<T>(fn: (token: string) => Promise<T>): Promise<T> {
  const user = auth.currentUser;
  if (!user) throw new Error("Sin sesión");
  return conTokenDe(user, fn);
}

/**
 * ¿El rechazo puede ser un token vencido? El backend no responde 401 a un token
 * inválido: lo deja pasar como anónimo y Spring Security contesta **403 sin
 * `code`**, igual que a quien está logueado sin permiso. Un `@PreAuthorize`
 * contesta 403 con `accessDenied`. Los 403 con otro `code` son errores de
 * dominio (`activityFull`, `forbiddenState`…): ésos se procesaron y no se
 * reintentan.
 */
function puedeSerTokenVencido(e: unknown): e is ApiError {
  if (!(e instanceof ApiError)) return false;
  if (e.status === 401) return true;
  return e.status === 403 && (!e.code || e.code === "accessDenied");
}

/**
 * Como `conToken`, para quien ya tiene el `User` (p. ej. dentro de un
 * `onAuthStateChanged`).
 *
 * Ante un rechazo que puede ser un token vencido (ver `puedeSerTokenVencido`)
 * se fuerza la renovación del token y se reintenta una vez. Así se distinguen
 * los dos casos que el backend responde igual:
 *
 * - si la renovación falla o el reintento da 401, la sesión ya no sirve: se
 *   cierra y se lleva al login con el aviso, recordando dónde estaba;
 * - si el reintento, con el token recién renovado, vuelve a dar 403, es falta
 *   de permiso de verdad y se propaga ese error.
 *
 * Reintentar una escritura es seguro: un pedido rechazado por autenticación o
 * permiso no llegó a procesarse.
 */
export async function conTokenDe<T>(user: User, fn: (token: string) => Promise<T>): Promise<T> {
  let primero: ApiError;
  try {
    return await fn(await user.getIdToken());
  } catch (e) {
    if (!puedeSerTokenVencido(e)) throw e;
    primero = e;
  }

  let renovado: string;
  try {
    renovado = await user.getIdToken(true);
  } catch {
    // No se pudo renovar (cuenta deshabilitada, sesión revocada): no hay sesión.
    void sesionVencida();
    throw primero;
  }

  try {
    return await fn(renovado);
  } catch (e) {
    if (e instanceof ApiError && e.status === 401) void sesionVencida();
    throw e;
  }
}

let cerrando = false;

/** Cierra la sesión y lleva a `/acceso?motivo=sesion-vencida&volver=…`. Una sola vez aunque fallen varios pedidos juntos. */
export async function sesionVencida(): Promise<void> {
  if (cerrando) return;
  cerrando = true;
  // Import dinámico: `useAuth` arrastra `usePush`, que usa este módulo.
  const { cerrarSesion } = await import("@/hooks/useAuth");
  await cerrarSesion(rutaAcceso({ motivo: "sesion-vencida", volver: rutaActual() }));
}
