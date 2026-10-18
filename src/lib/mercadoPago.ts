/**
 * Checkout Pro de Mercado Pago para una preferencia. Se va por redirección y no
 * con el Wallet brick porque la preferencia la crea el backend con el token del
 * establecimiento (split de marketplace): el brick tendría que leerla con la
 * public key de ese vendedor, y la de Agrotours recibe un 401. La redirección
 * corre en el dominio de Mercado Pago y no necesita ninguna key.
 *
 * La misma preferencia sirve para reintentar: un pago rechazado o abandonado no
 * la consume, y deja de abrir recién cuando vence.
 *
 * TODO backend: que `POST /reserva/reservar` devuelva el `initPoint` de la
 * preferencia, así esta URL no se arma a mano en el front.
 */
export function urlCheckout(preferenceId: string): string {
  return `https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=${encodeURIComponent(preferenceId)}`;
}

/** Cómo volvió el visitante del checkout, ya traducido del `status` de Mercado Pago. */
export type RetornoPago = "aprobado" | "pendiente" | "rechazado";

const RETORNOS: readonly RetornoPago[] = ["aprobado", "pendiente", "rechazado"];

/** Lee el `?pago=` del detalle de la reserva. Cualquier otro valor es que no se vuelve del checkout. */
export function leerRetornoPago(v: string | undefined): RetornoPago | null {
  return RETORNOS.find((r) => r === v) ?? null;
}

/**
 * Traduce el `status` con el que vuelve Mercado Pago. `in_process` es un pago en
 * revisión; cualquier otro (`rejected`, `null` cuando se abandona el checkout, o
 * vacío) cuenta como no pagado.
 */
export function retornoDeStatus(status: string | undefined): RetornoPago {
  if (status === "approved") return "aprobado";
  if (status === "pending" || status === "in_process") return "pendiente";
  return "rechazado";
}
