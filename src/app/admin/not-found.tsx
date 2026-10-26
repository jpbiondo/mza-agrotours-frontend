import type { Metadata } from "next";
import { NotFoundScreen } from "@/components/ui/StatusScreen";

export const metadata: Metadata = {
  title: "Página no encontrada · Administración · Mendoza AgroTours",
};

/**
 * Ruta inexistente dentro de /admin. Se pinta como `children` del layout, o sea
 * detrás de `GuardRol`: quien no es admin recibe lo mismo que en una pantalla
 * que existe (login o sin acceso), y no puede usar el 404 para mapear rutas.
 */
export default function AdminNotFound() {
  return (
    <NotFoundScreen
      motivo="Puede que la dirección esté mal escrita o que la sección ya no exista."
      volver={{ href: "/admin", label: "Ir al panel del sistema" }}
    />
  );
}
