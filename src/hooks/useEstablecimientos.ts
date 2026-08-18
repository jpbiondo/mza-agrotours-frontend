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
  const elegido = useEstablecimientoStore((s) => s.elegido);
  const elegir = useEstablecimientoStore((s) => s.elegir);

  const lista = useMemo(() => establecimientosDe(accesos), [accesos]);
  const activo = lista.find((e) => e.id === elegido) ?? lista[0] ?? null;

  return { lista, activo, elegir };
}
