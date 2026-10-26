import { notFound } from "next/navigation";

/**
 * Atrapa toda URL bajo `/panel/{id}` que no es una pantalla. Va debajo del
 * establecimiento y no de `/panel` a propósito: `/panel/reservas` (URL de antes
 * del id) lo rescata `GuardEstablecimientoUrl`, y un id ajeno redirige antes de
 * llegar acá.
 */
export default function PanelRutaInexistente() {
  notFound();
}
