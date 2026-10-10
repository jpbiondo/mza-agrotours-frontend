"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useEstablecimientoPorDefecto, useEstablecimientos } from "@/hooks/useEstablecimientos";
import { RAIZ_PANEL, rescatarRuta } from "@/lib/rutasPanel";
import { useEstablecimientoStore } from "@/stores/establecimientoStore";

/**
 * Valida el establecimiento de la URL de todo `/panel/{id}/...`:
 *
 * - si es de la cuenta, lo recuerda como el último mirado, que es a donde
 *   lleva `/panel` la próxima vez;
 * - si no lo es —id ajeno, establecimiento dado de baja, o una URL de antes
 *   del cambio como `/panel/reservas`, donde "reservas" cae como id—, manda al
 *   establecimiento por defecto. Ver `rescatarRuta`.
 *
 * Se espera a que rehidraten los stores antes de decidir: sin los accesos, todo
 * id parece ajeno.
 *
 * Es control de navegación, no de seguridad: los accesos salen de un store que
 * se puede editar desde el navegador. La barrera real es el backend.
 */
export default function GuardEstablecimientoUrl({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { activo, listo } = useEstablecimientos();
  const { destino, listo: destinoListo } = useEstablecimientoPorDefecto();
  const recordar = useEstablecimientoStore((s) => s.elegir);

  const activoId = activo?.id ?? null;
  const invalido = listo && !activo;

  // Recién con el store rehidratado: escribir antes pisaría el valor guardado
  // y la rehidratación lo volvería a pisar con el viejo.
  useEffect(() => {
    if (activoId && destinoListo) recordar(activoId);
  }, [activoId, destinoListo, recordar]);

  useEffect(() => {
    if (!invalido || !destinoListo) return;
    // Sin ningún establecimiento, `/panel` muestra cómo pedir el alta.
    router.replace(destino ? rescatarRuta(pathname, destino.id) : RAIZ_PANEL);
  }, [invalido, destinoListo, destino, pathname, router]);

  if (!listo || invalido) return null;
  return <>{children}</>;
}
