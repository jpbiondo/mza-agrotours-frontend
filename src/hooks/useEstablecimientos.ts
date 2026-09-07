import { useMemo } from "react";
import { establecimientosDe } from "@/lib/roles";
import type { EstablecimientoAcceso } from "@/lib/roles";
import { useAuthStore } from "@/stores/authStore";
import { useEstablecimientoStore } from "@/stores/establecimientoStore";

interface UseEstablecimientosReturn {
  /** Todos los establecimientos donde la cuenta es productora. */
  lista: EstablecimientoAcceso[];
  /** El que se está mirando, o `null` si la cuenta no tiene ninguno. */
  activo: EstablecimientoAcceso | null;
  elegir: (id: string) => void;
  /**
   * `true` cuando los dos stores persistidos —sesión y switcher— ya
   * rehidrataron, o sea cuando `activo` es el establecimiento que el productor
   * eligió y no el primero de la lista.
   *
   * Lo necesita todo lo que decide *sobre cuál* establecimiento se está
   * parado: bloquear una acción o redirigir con la lectura provisoria sacaría
   * de la pantalla a alguien que sí puede estar ahí. Para pedir datos alcanza
   * con `activo?.id`, que se corrige solo cuando termina de rehidratar.
   */
  listo: boolean;
}

/**
 * Establecimientos del productor y cuál está activo. La lista sale de los
 * accesos —o sea del backend— y la elección del store persistido.
 *
 * Si el elegido ya no está entre los accesos (le sacaron el rol, se dio de baja
 * el establecimiento) se cae al primero en lugar de quedar en la nada.
 */
export function useEstablecimientos(): UseEstablecimientosReturn {
  const accesos = useAuthStore((s) => s.accesos);
  const sesionLista = useAuthStore((s) => s.hasHydrated);
  const elegido = useEstablecimientoStore((s) => s.elegido);
  const elegir = useEstablecimientoStore((s) => s.elegir);
  const switcherListo = useEstablecimientoStore((s) => s.hasHydrated);

  const lista = useMemo(() => establecimientosDe(accesos), [accesos]);
  const activo = lista.find((e) => e.id === elegido) ?? lista[0] ?? null;

  return { lista, activo, elegir, listo: sesionLista && switcherListo };
}
