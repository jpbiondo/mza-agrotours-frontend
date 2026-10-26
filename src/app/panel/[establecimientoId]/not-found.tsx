import type { Metadata } from "next";
import { NotFoundScreen } from "@/components/ui/StatusScreen";
import { RAIZ_PANEL } from "@/lib/rutasPanel";

export const metadata: Metadata = {
  title: "Página no encontrada · Panel del productor · Mendoza AgroTours",
};

/**
 * Ruta inexistente dentro del panel. Va bajo `[establecimientoId]` y no en
 * `/panel` para quedar dentro de `GuardEstablecimientoUrl`: un not-found más
 * arriba reemplazaría el layout del establecimiento entero, y un id ajeno daría
 * 404 en vez de redirigir. Así pasa por todos los guards: sin rol de productor,
 * con la cuenta suspendida o con un id ajeno, se ve lo mismo que en una
 * pantalla que existe.
 *
 * Vuelve a `/panel`, que lleva al último establecimiento mirado.
 */
export default function PanelNotFound() {
  return (
    <NotFoundScreen
      motivo="Puede que la dirección esté mal escrita o que la sección ya no exista."
      volver={{ href: RAIZ_PANEL, label: "Ir al panel" }}
    />
  );
}
