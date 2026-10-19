import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
import { NotFoundScreen } from "@/components/ui/StatusScreen";

export const metadata: Metadata = {
  title: "Página no encontrada · Mendoza AgroTours",
};

/**
 * Ruta inexistente. Lleva la navbar del sitio para que la persona pueda seguir
 * navegando: este archivo cuelga del layout raíz, que no tiene chrome.
 *
 * Un id inexistente dentro de una ruta que sí existe (una receta borrada) no
 * llega acá: lo resuelve la pantalla con `<NotFoundScreen cosa="…">`.
 */
export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <NotFoundScreen motivo="Puede que la dirección esté mal escrita o que la página ya no exista." />
    </>
  );
}
