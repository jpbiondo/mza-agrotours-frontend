import { useCallback, useMemo } from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
import { establecimientosDe } from "@/lib/roles";
import type { EstablecimientoAcceso } from "@/lib/roles";
import { enOtroEstablecimiento, RAIZ_PANEL, rutaPanel } from "@/lib/rutasPanel";
import { useAuthStore } from "@/stores/authStore";
import { useEstablecimientoStore } from "@/stores/establecimientoStore";

/** El `[establecimientoId]` de la URL, o `null` fuera de `/panel/{id}`. */
function useIdDeUrl(): string | null {
  const params = useParams<{ establecimientoId?: string | string[] }>();
  const id = params?.establecimientoId;
  return typeof id === "string" && id ? id : null;
}

interface UseEstablecimientosReturn {
  /** Todos los establecimientos donde la cuenta es productora. */
  lista: EstablecimientoAcceso[];
  /**
   * El de la URL, si está entre los accesos de la cuenta. `null` en `/panel` a
   * secas, mientras la sesión rehidrata o con un id ajeno en la URL (de eso se
   * ocupa `GuardEstablecimientoUrl`, que redirige).
   */
  activo: EstablecimientoAcceso | null;
  /** Va al mismo lugar del panel en otro establecimiento. */
  elegir: (id: string) => void;
  /**
   * `true` cuando la sesión ya rehidrató, o sea cuando un `activo` en `null`
   * quiere decir de verdad que el id de la URL no es de la cuenta y no que los
   * accesos todavía no llegaron.
   */
  listo: boolean;
}

/**
 * Establecimientos del productor y en cuál está parado. La lista sale de los
 * accesos —o sea del backend— y el activo, del id de la URL: nunca hay una
 * lectura provisoria que después cambie.
 */
export function useEstablecimientos(): UseEstablecimientosReturn {
  const accesos = useAuthStore((s) => s.accesos);
  const listo = useAuthStore((s) => s.hasHydrated);
  const idUrl = useIdDeUrl();
  const router = useRouter();
  const pathname = usePathname();

  const lista = useMemo(() => establecimientosDe(accesos), [accesos]);
  const activo = idUrl ? (lista.find((e) => e.id === idUrl) ?? null) : null;

  const elegir = useCallback(
    (id: string) => router.push(enOtroEstablecimiento(pathname, id)),
    [router, pathname],
  );

  return { lista, activo, elegir, listo };
}

/**
 * A qué establecimiento ir cuando se entra al panel sin uno en la URL: el
 * último que se miró, si la cuenta todavía lo tiene; si no, el primero. `null`
 * es "no tiene ninguno".
 *
 * `listo` espera a los dos stores persistidos: decidir antes mandaría al
 * primero de la lista a quien estaba trabajando en otro.
 */
export function useEstablecimientoPorDefecto(): {
  destino: EstablecimientoAcceso | null;
  listo: boolean;
} {
  const { lista, listo: sesionLista } = useEstablecimientos();
  const ultimo = useEstablecimientoStore((s) => s.elegido);
  const ultimoListo = useEstablecimientoStore((s) => s.hasHydrated);
  return {
    destino: lista.find((e) => e.id === ultimo) ?? lista[0] ?? null,
    listo: sesionLista && ultimoListo,
  };
}

/**
 * Arma rutas del panel en el establecimiento de la URL: `ruta("reservas")`
 * da `/panel/{id}/reservas`. Fuera de `/panel/{id}` cae en `/panel`, que
 * redirige al que corresponda.
 */
export function useRutaPanel(): (...partes: string[]) => string {
  const idUrl = useIdDeUrl();
  return useCallback(
    (...partes: string[]) => (idUrl ? rutaPanel(idUrl, ...partes) : RAIZ_PANEL),
    [idUrl],
  );
}
