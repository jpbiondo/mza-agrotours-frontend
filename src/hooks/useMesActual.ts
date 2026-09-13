import { useSyncExternalStore } from "react";

/** El mes no cambia mientras la pantalla está abierta: nada a lo que suscribirse. */
const suscribir = () => () => {};
const enCliente = () => new Date().getMonth();
const enServidor = () => null;

/**
 * Mes actual (0-11) del navegador, o `null` mientras se renderiza en el server.
 *
 * Las pantallas de `(sitio)` se prerenderizan, así que un `new Date()` directo
 * hornearía el mes del build en el HTML y no coincidiría con el del visitante:
 * mismatch de hidratación. Con `useSyncExternalStore` el server no dibuja nada
 * y el mes aparece al hidratar, sin llamar `setState` dentro de un efecto.
 *
 * Es sólo para lo visual (resaltar el mes en el calendario, nombrarlo en el
 * filtro): quién está **en temporada** lo decide el backend, con su propio mes.
 */
export function useMesActual(): number | null {
  return useSyncExternalStore(suscribir, enCliente, enServidor);
}
